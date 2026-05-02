import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Hospital from "../models/hospital.model";
import { publishEvent } from "../events/publisher";
import { Op } from "sequelize";
import twilio from "twilio";
import { logger } from "../utils/logger";
import { sendEmail } from "../services/mail.service";

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

// Helper for Twilio Client
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return null;
  }
  return twilio(sid, token);
};

                                                                                                                                   

export const sendOtpEmail = async (email: string, otp: string, hospitalName: string) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #007bff; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Hosta Hospital</h1>
      </div>
      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello <strong>${hospitalName}</strong>,</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Use the following security code to complete your login. This code is valid for <strong>10 minutes</strong>.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px 40px; font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">
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

  await sendEmail(email, "Your Verification Code - Hosta Hospital", html);
};

// REGISTER - POST /hospital/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, address, phone, emergencyContact, email, password, latitude, longitude,  about,  working_hours_clinic, working_hours_general,  working_hours_clinic_nobreak, web } = req.body;


  const exist = await Hospital.findOne({ where: { phone: phone } });
  if (exist) {
    res.status(404).json({
      success: false,
      message: "Hospital is already exist",
      data: null,
      error: { code: "HOSPITAL_ALREADY_EXISTS", details: null },
    });
    return;
  }

  const newHospital = await Hospital.create({
   name, 
   phone, 
   email, 
   password, 
   type,
   emergencyContact,
   latitude,
   longitude,
   about,
   working_hours_clinic,
   working_hours_general, 
   address, 
   working_hours_clinic_nobreak,
   web
  });

  await publishEvent("hospital_events", "HOSPITAL_REGISTERED", {
    hospitalId: newHospital.id,
    phone: newHospital.phone,
  });

  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: null,
    error: null,
  });
});

// LOGIN - POST /hospital/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    res.status(400).json({
      success: false,
      message: "Identifier (email/phone) and password are required",
    });
    return;
  }

  // Find hospital by email OR phone
  const hospital = await Hospital.scope("withPassword").findOne({
    where: {
      [Op.or]: [
        email ? { email } : null,
        phone ? { phone } : null,
      ].filter(Boolean) as any,
    },
  });

  if (!hospital) {
    res.status(401).json({
      success: false,
      message: "Hospital not found! Please register",
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, hospital.password || "");
  if (!checkPassword) {
    res.status(401).json({
      success: false,
      message: "Wrong password, Please try again",
      data: null,
      error: { code: "WRONG_PASSWORD", details: null },
    });
    return;
  }

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId }, jwtKey, {
    expiresIn: "15m",
  });

  // Remove password and OTP fields from response
  const { password: _, otp: __, otpExpiry: ___, ...safeHospital } = hospital.get();

  const refreshToken = jwt.sign({ id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId }, jwtKey, {
    expiresIn: "7d",
  });

  // Save refresh token to Redis (REMOVED)

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    status: 200,
    token, // Return token for API Gateway forwarding
    data: safeHospital,
    error: null,
  });
});

// LOGIN WITH PHONE (OTP REQUEST) - POST /hospital/login/phone
export const loginWithPhone: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  
  if (!phone) {
    res.status(400).json({ success: false, message: "Phone number is required" });
    return;
  }

  let numericPhone = phone.replace(/\D/g, "").slice(-10);

  const hospital = await Hospital.findOne({ where: { phone: numericPhone } });
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Hospital not found with this phone number",
    });
    return;
  }

  // Generate JWT tokens
  const token = jwt.sign({ id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId, }, process.env.JWT_SECRET || "supersecretjwtkey", {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId },
    process.env.JWT_SECRET || "supersecretjwtkey",
    { expiresIn: "7d" }
  );

  // Generate 6-digit OTP
  const otp = numericPhone === APPLE_TEST_NUMBER 
    ? APPLE_TEST_OTP 
    : Math.floor(100000 + Math.random() * 900000).toString();
    
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

  await hospital.update({ otp, otpExpiry });

  if (numericPhone !== APPLE_TEST_NUMBER) {
    // 1. Send OTP via Twilio (SMS)
    const client = getTwilioClient();
    const twilioNumber = process.env.TWILIO_NUMBER;

    if (client && twilioNumber) {
      try {
        const targetNumber = phone.startsWith("+") ? phone : `+91${numericPhone}`;
        await client.messages.create({
          body: `Your Hosta Hospital verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioNumber,
          to: targetNumber,
        });
        logger.info("OTP SMS sent successfully", { phone: targetNumber });
      } catch (err: any) {
        logger.error("Twilio Error:", { message: err.message, phone: numericPhone });
      }
    }

    // 2. Send OTP via Email (if exists)
    if (hospital.email) {
      try {
        await sendOtpEmail(hospital.email, otp, hospital.name);
      } catch (err: any) {
        logger.error("Email OTP Error:", { message: err.message, email: hospital.email });
      }
    }
  }

  // Save refresh token to Redis (REMOVED)

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    status: 200,
    token,
    error: null,
    message: numericPhone === APPLE_TEST_NUMBER ? "OTP sent (TEST ACCOUNT)" : "OTP sent to your registered phone and email",
    data: numericPhone === APPLE_TEST_NUMBER ? { otp: APPLE_TEST_OTP } : null,
  });
});

// SEND OTP (EMAIL) - POST /hospital/auth/send-otp
export const sendOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: "Email is required" });
    return;
  }

  const hospital = await Hospital.findOne({ where: { email } });
  if (!hospital) {
    res.status(404).json({ success: false, message: "Hospital not found with this email" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await hospital.update({ otp, otpExpiry });

  try {
    await sendOtpEmail(email, otp, hospital.name);
    res.json({ success: true, message: "OTP sent to email" });
    return;
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send email" });
    return;
  }
});

// VERIFY OTP - POST /hospital/auth/verify-otp & /hospital/otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, email, otp } = req.body;

  if ((!phone && !email) || !otp) {
    res.status(400).json({ success: false, message: "Identifier (phone/email) and OTP are required" });
    return;
  }

  let hospital;
  if (phone) {
    let numericPhone = phone.replace(/\D/g, "").slice(-10);
    hospital = await Hospital.scope("withPassword").findOne({ where: { phone: numericPhone } });
  } else if (email) {
    hospital = await Hospital.scope("withPassword").findOne({ where: { email } });
  }

  if (!hospital || hospital.otp !== otp.toString()) {
    res.status(400).json({ success: false, message: "Invalid OTP" });
    return;
  }

  if (hospital.otpExpiry && new Date() > hospital.otpExpiry) {
    res.status(400).json({ success: false, message: "OTP has expired" });
    return;
  }

  // Clear OTP after successful verification
  await hospital.update({ otp: null, otpExpiry: null });

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId }, jwtKey, {
    expiresIn: "15m",
  });

  // Remove password and OTP fields from response
  const { password: _, otp: __, otpExpiry: ___, ...safeHospital } = hospital.get();

  const refreshToken = jwt.sign({ id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId }, jwtKey, {
    expiresIn: "7d",
  });

  // Save refresh token to Redis (REMOVED)

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({ 
    success: true, 
    message: "OTP verified",
    token,
    data: safeHospital 
  });
});

export const verifyLoginOtp = verifyOtp;

// RESET PASSWORD - POST /hospital/auth/reset-password
export const resetPassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const hospital = await Hospital.scope("withPassword").findOne({ where: { email } });

  if (!hospital || hospital.otp !== otp.toString() || (hospital.otpExpiry && new Date() > hospital.otpExpiry)) {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    return;
  }

  hospital.password = newPassword;
  hospital.otp = null as any;
  hospital.otpExpiry = null as any;

  await hospital.save();

  res.json({ success: true, message: "Password reset successful" });
});

// CHANGE PASSWORD (JWT) - PUT /hospital/auth/change-password
export const changePassword: any = asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const hospital = await Hospital.scope("withPassword").findByPk(req.user.id);
  if (!hospital) {
    res.status(404).json({ success: false, message: "Hospital not found" });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, hospital.password || "");
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Incorrect current password" });
    return;
  }

  hospital.password = newPassword;
  await hospital.save();

  res.json({ success: true, message: "Password changed successfully" });
});

// SEND NOTIFICATION EMAIL - POST /hospital/notify/email
export const sendCustomEmail: any = asyncHandler(async (req: Request, res: Response) => {
  const { to, subject, message } = req.body;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Hosta Health Notification</h2>
      <p>${message}</p>
      <hr />
      <small>Sent via Hosta Hospital Service</small>
    </div>
  `;

  await sendEmail(to, subject, html);
  res.json({ success: true, message: "Notification email sent" });
});

// GET ONE - GET /hospital/:id
export const getanHospital : any = asyncHandler(async (req: Request, res: Response) => {
  const hospital = await  Hospital.findByPk(req.params.id);
  
  
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Hospital not found",
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: hospital,
    error: null,
  });
});

// UPDATE - PUT /hospital/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const hospital = await Hospital.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!hospital[1] || hospital[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Hospital not found",
      status: 200,
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("hospital_events", "HOSPITAL_UPDATED", {
    hospitalId: hospital[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: hospital[1][0],
    error: null,
  });
});

// DELETE - DELETE /hospital/:id
export const hospitalDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const hospital = await Hospital.findByPk(id);
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Hospital not found",
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }

  // 🔥 Perform Soft Delete (requires paranoid: true in model)
  await hospital.destroy();

  await publishEvent("hospital_events", "HOSPITAL_DELETED", {
    hospitalId: id,
  });

  res.status(200).json({
    success: true,
    message: "Hospital account soft-deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});

// GET ALL - GET /hospital 
export const getHospital: any = asyncHandler(async (req: Request, res: Response) => {
  const hospital = await Hospital.findAll();

  if (hospital.length === 0) {
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
    data: hospital,
    error: null,
  });
});

// REFRESH TOKEN - POST /hospital/refresh
export const refreshHospitalToken: any = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "Refresh token missing" });
    return;
  }

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";

  try {
    const decoded: any = jwt.verify(refreshToken, jwtKey);
    
    // Check Redis Blacklist / Rotation (REMOVED)

    const hospital = await Hospital.findByPk(decoded.id);

    if (!hospital) {
      res.status(401).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const newToken = jwt.sign({ id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId }, jwtKey, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign({ id: hospital.id, name: hospital.name, role: "hospital", roleId: hospital.roleId }, jwtKey, {
      expiresIn: "7d",
    });

    // Redis Rotation (REMOVED)
    setRefreshTokenCookie(res, newRefreshToken);

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

// LOGOUT - POST /hospital/logout
export const logout: any = asyncHandler(async (req: Request, res: Response) => {
  // Redis Blacklist (REMOVED)
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});