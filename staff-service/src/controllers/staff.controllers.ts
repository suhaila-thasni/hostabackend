import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import twilio from "twilio";
import axios from "axios";
import Staff from "../models/staff.model";
import { publishEvent } from "../events/publisher";
import { sendEmail } from "../services/mail.service";
import { logger } from "../utils/logger";

// Helper to set refresh token cookie
const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};

const APPLE_TEST_NUMBER = "9999999999";
const APPLE_TEST_OTP = "123456";

export const sendStaffOtpEmail = async (email: string, otp: string, staffName: string) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #28a745; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Hosta Staff</h1>
      </div>
      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello <strong>${staffName}</strong>,</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Use the following security code to complete your verification. This code is valid for <strong>10 minutes</strong>.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background-color: #f8f9fa; border: 2px dashed #28a745; border-radius: 8px; padding: 20px 40px; font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #999; font-size: 14px; line-height: 1.5; border-top: 1px solid #eee; pt: 20px;">
          If you didn't request this, please ignore this email or contact support if you have concerns.
        </p>
      </div>
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px;">
        &copy; 2026 Hosta Health. All rights reserved.
      </div>
    </div>
  `;

  await sendEmail(email, "Your Verification Code - Hosta Staff", html);
};

let twilioClient: any = null;

const getTwilioClient = () => {
  if (twilioClient) return twilioClient;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    logger.warn("Twilio credentials NOT FOUND in environment variables. SMS will NOT be sent.");
    return null;
  }

  try {
    twilioClient = twilio(sid, token);
    return twilioClient;
  } catch (error) {
    logger.error("Failed to initialize Twilio client", error);
    return null;
  }
};

import { httpClient } from "../utils/httpClient";

// REGISTER - POST /staff/register                             
export const Registeration: any = asyncHandler(async (req: any, res: Response) => {
  
  const { hospitalId: bodyHospitalId, name, phone, email, password,  designation, joiningDate, jobType, staffType,  dob, gender, knowLanguages, qualification, address } = req.body;

  const tokenHospitalId = req.user?.id;
  const authHeader = req.headers.authorization;

  // 1. Security Check: If hospitalId is provided in body, it must match the token ID
  if (bodyHospitalId && Number(bodyHospitalId) !== Number(tokenHospitalId)) {
    res.status(403).json({
      success: false,
      message: "Security violation: The provided hospitalId does not match your authenticated account.",
      error: { code: "HOSPITAL_ID_MISMATCH" }
    });
    return;
  }

  const hospitalId = tokenHospitalId; // Source of truth

  if (!hospitalId) {
    res.status(400).json({ success: false, message: "Hospital ID is required" });
    return;
  }

  // 2. Validate hospitalId via hospital-service
  try {
    const hospitalResponse = await httpClient.get(`http://hospital-service:3009/hospital/${hospitalId}`, {
      headers: { Authorization: authHeader }
    });
    if (!hospitalResponse.data || !hospitalResponse.data.success) {
      res.status(400).json({ success: false, message: "Invalid hospital ID" });
      return;
    }
  } catch (error) {
    res.status(404).json({ 
      success: false, 
      message: `Hospital with ID ${hospitalId} does not exist in the hospital service.`,
      error: { code: "HOSPITAL_NOT_FOUND" }
    });
    return;
  }

  const phoneExists = await Staff.findOne({ where: { phone } });
  if (phoneExists) {
    res.status(400).json({
      success: false,
      message: "Phone number already registered",
      error: { code: "PHONE_EXISTS" },
    });
    return;
  }

  const emailExists = await Staff.findOne({ where: { email } });
  if (emailExists) {
    res.status(400).json({
      success: false,
      message: "Email already registered",
      error: { code: "EMAIL_EXISTS" },
    });
    return;
  }

  try {
    const newStaff = await Staff.create({
      hospitalId, name, phone, email, password, dob, gender, 
      knowLanguages, qualification, address, 
      designation, joiningDate, jobType, staffType,
    });

    await publishEvent("staff_events", "STAFF_REGISTERED", {
      staffId: newStaff.id,
      phone: newStaff.phone,
    });

    res.status(201).json({
      success: true,
      message: "Registration completed successfully",
    });
  } catch (error: any) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({
        success: false,
        message: "Staff with this phone or email already exists",
        error: { code: "BAD_REQUEST", details: error.errors[0].message }
      });
    } else {
      throw error; // Let global error handler handle other 500s
    }
  }
});

// LOGIN - POST /staff/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    res.status(400).json({
      success: false,
      message: "Please provide either email or phone number",
      error: { code: "IDENTITY_REQUIRED", details: null },
    });
    return;
  }

  const staff = await Staff.scope("withPassword").findOne({
    where: {
      [Op.or]: [{ email: email || null }, { phone: phone || null }],
    },
  });

  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found! Please register",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, staff.password || "");
  if (!checkPassword) {
    res.status(401).json({
      success: false,
      message: "Wrong password, Please try again",
      data: null,
      error: { code: "WRONG_PASSWORD", details: null },
    });
    return;
  }

  const jwtKey = process.env.JWT_SECRET;
  if (!jwtKey) {
    res.status(500).json({
      success: false,
      message: "JWT_SECRET is not defined",
      data: null,
      error: { code: "JWT_SECRET_NOT_DEFINED", details: null },
    });
    return;
  }

  // Generate JWT tokens
  const token = jwt.sign({ id: staff.id, name: staff.name, role: "staff" }, jwtKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: staff.id, name: staff.name, role: "staff" },
    jwtKey,
    { expiresIn: "7d" }
  );

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    status: 200,
    token, // Show token in response as requested
    data: staff,
    error: null,
  });
});

// LOGIN WITH PHONE - POST /staff/login/phone
export const loginWithPhone: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ success: false, message: "Phone number is required" });
    return;
  }

  let numericPhone = phone.replace(/\D/g, "").slice(-10);
  const staff = await Staff.findOne({ where: { phone: numericPhone } });

  if (!staff) {
    res.status(404).json({ success: false, message: "Phone number not registered!" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  staff.otp = otp;
  staff.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await staff.save();

  try {
    const client = getTwilioClient();
    const from = process.env.TWILIO_NUMBER;

    if (client && from) {
      const targetNumber = phone.startsWith("+") ? phone : `+91${numericPhone}`;
      await client.messages.create({
        body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
        from: from,
        to: targetNumber,
      });
      logger.info("OTP SMS sent successfully", { phone: targetNumber });
    } else {
      logger.warn("Development Mode: OTP created but not sent via SMS (Missing Twilio Config)", {
        numericPhone,
        otp
      });
    }
  } catch (twilioError: any) {
    logger.error("Production Error: Twilio SMS failed to send", {
      error: twilioError.message,
      phone: numericPhone,
      otp
    });
  }

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    status: 200,
    otp: process.env.NODE_ENV === "development" ? otp : undefined,
  });
});

// VERIFY OTP - POST /staff/verify-otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400).json({ success: false, message: "Phone and OTP are required" });
    return;
  }

  let numericPhone = phone.replace(/\D/g, "").slice(-10);
  const staff = await Staff.findOne({ where: { phone: numericPhone } });

  if (!staff || staff.otp !== otp.toString()) {
    res.status(400).json({ success: false, message: "Invalid OTP" });
    return;
  }

  if (staff.otpExpiry && new Date() > staff.otpExpiry) {
    res.status(400).json({ success: false, message: "OTP has expired" });
    return;
  }

  // Clear OTP
  staff.otp = undefined;
  staff.otpExpiry = undefined;
  await staff.save();

  const jwtKey = process.env.JWT_SECRET;
  if (!jwtKey) {
    res.status(500).json({ success: false, message: "JWT_SECRET not defined" });
    return;
  }

  const token = jwt.sign({ id: staff.id, name: staff.name, role: "staff" }, jwtKey, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ id: staff.id, name: staff.name, role: "staff" }, jwtKey, { expiresIn: "7d" });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    data: staff,
    status: 200,
  });
});

// GET ONE - GET /staff/:id
export const getanStaff : any = asyncHandler(async (req: Request, res: Response) => {
  const staff = await Staff.findByPk(req.params.id);
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: staff,
    error: null,
  });
});

// UPDATE - PUT /staff/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: _, ...updatePayload } = req.body; // Remove id from payload if present

  const staff = await Staff.findByPk(id);

  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found",
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  // Validate hospitalId if it's being updated
  if (updatePayload.hospitalId) {
    try {
      const hospitalResponse = await axios.get(`http://hospital-service:3009/hospital/${updatePayload.hospitalId}`);
      if (!hospitalResponse.data || !hospitalResponse.data.success) {
        res.status(400).json({ success: false, message: "Invalid hospital ID" });
        return;
      }
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        message: "Hospital validation failed. Please ensure the hospital exists.",
        error: { code: "HOSPITAL_VALIDATION_FAILED" }
      });
      return;
    }
  }

  try {
    // 🔥 Use instance update to trigger beforeUpdate hooks (password hashing)
    await staff.update(updatePayload);

    await publishEvent("staff_events", "STAFF_UPDATED", {
      staffId: staff.id,
    });

    res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: staff,
      error: null,
    });
  } catch (error: any) {
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({
        success: false,
        message: "Phone or email already in use by another staff member",
        error: { code: "CONFLICT", details: error.errors[0].message }
      });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        error: { code: "BAD_REQUEST", details: error.errors.map((e: any) => e.message) }
      });
    } else {
      throw error;
    }
  }
});

// DELETE - DELETE /staff/:id
export const staffDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const staff = await Staff.findByPk(id);
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  // 🔥 Perform Soft Delete (requires paranoid: true in model)
  await staff.destroy();

  res.status(200).json({
    success: true,
    message: "Staff soft-deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});

// GET ALL - GET /staff
export const getStaffs: any = asyncHandler(async (req: Request, res: Response) => {
  const staff = await Staff.findAll();

  if (staff.length === 0) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "NO_DATA_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: staff,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /staff/changepassword
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, newPassword } = req.body;

  const staff = await Staff.scope("withPassword").findOne({ where: { email } });
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Staff not found",
      data: null,
      error: { code: "STAFF_NOT_FOUND", details: null },
    });
    return;
  }

  // If password is provided, verify it first (like user service)
  if (password) {
    const isMatch = await bcrypt.compare(password, staff.password || "");
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Incorrect current password",
        error: { code: "UNAUTHORIZED", details: null }
      });
      return;
    }
  }

  staff.password = newPassword || password; // Use newPassword if provided, else keep same if verified? No, usually it's for reset.
  
  if (newPassword) {
    staff.password = newPassword;
  }

  await staff.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
    status: 200,
    data: staff,
    error: null,
  });
});

// SEND STAFF OTP (EMAIL) - POST /staff/auth/send-otp
export const sendStaffOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: "Email is required" });
    return;
  }

  const staff = await Staff.findOne({ where: { email } });
  if (!staff) {
    res.status(404).json({ success: false, message: "Staff not found with this email" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await staff.update({ otp, otpExpiry });

  try {
    await sendStaffOtpEmail(email, otp, staff.name);
    res.json({ success: true, message: "OTP sent to email" });
    return;
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send email" });
    return;
  }
});

// VERIFY STAFF OTP - POST /staff/auth/verify-otp
export const verifyStaffOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, email, otp } = req.body;

  if ((!phone && !email) || !otp) {
    res.status(400).json({ success: false, message: "Identifier (phone/email) and OTP are required" });
    return;
  }

  let staff;
  if (phone) {
    let numericPhone = phone.replace(/\D/g, "").slice(-10);
    staff = await Staff.scope("withPassword").findOne({ where: { phone: numericPhone } });
  } else if (email) {
    staff = await Staff.scope("withPassword").findOne({ where: { email } });
  }

  if (!staff || staff.otp !== otp.toString()) {
    res.status(400).json({ success: false, message: "Invalid OTP" });
    return;
  }

  if (staff.otpExpiry && new Date() > staff.otpExpiry) {
    res.status(400).json({ success: false, message: "OTP has expired" });
    return;
  }

  // Clear OTP after successful verification
  await staff.update({ otp: null, otpExpiry: null });

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: staff.id, name: staff.name, role: "staff" }, jwtKey, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id: staff.id, name: staff.name, role: "staff" }, jwtKey, {
    expiresIn: "7d",
  });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({ 
    success: true, 
    message: "OTP verified",
    token,
    data: staff 
  });
});

// RESET STAFF PASSWORD - POST /staff/auth/reset-password
export const resetStaffPassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const staff = await Staff.scope("withPassword").findOne({ where: { email } });

  if (!staff || staff.otp !== otp.toString() || (staff.otpExpiry && new Date() > staff.otpExpiry)) {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    return;
  }

  staff.password = newPassword;
  staff.otp = null as any;
  staff.otpExpiry = null as any;

  await staff.save();

  res.json({ success: true, message: "Password reset successful" });
});

// CHANGE STAFF PASSWORD (JWT) - PUT /staff/auth/change-password
export const changeStaffPassword: any = asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const staff = await Staff.scope("withPassword").findByPk(req.user.id);
  if (!staff) {
    res.status(404).json({ success: false, message: "Staff not found" });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, staff.password || "");
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Incorrect current password" });
    return;
  }

  staff.password = newPassword;
  await staff.save();

  res.json({ success: true, message: "Password changed successfully" });
});

// REFRESH TOKEN - POST /staff/refresh
export const refreshStaffToken: any = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "Refresh token missing" });
    return;
  }

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";

  try {
    const decoded: any = jwt.verify(refreshToken, jwtKey);
    const staff = await Staff.findByPk(decoded.id);

    if (!staff) {
      res.status(401).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const newToken = jwt.sign({ id: staff.id, name: staff.name, role: "staff" }, jwtKey, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign({ id: staff.id, name: staff.name, role: "staff" }, jwtKey, {
      expiresIn: "7d",
    });

    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

// LOGOUT - POST /staff/logout
export const logout: any = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});