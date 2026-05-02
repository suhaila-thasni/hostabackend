import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import axios from "axios";
import asyncHandler from "express-async-handler";
import Lab from "../models/lab.model";
import { publishEvent } from "../events/publisher";
import { generateToken } from "../services/jwt.service";
import { Op } from "sequelize";
import twilio from "twilio";
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

export const sendOtpEmail = async (email: string, otp: string, labName: string) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #007bff; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Hosta Lab</h1>
      </div>
      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello <strong>${labName}</strong>,</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Use the following security code to complete your verification. This code is valid for <strong>10 minutes</strong>.</p>
        
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

  await sendEmail(email, "Your Verification Code - Hosta Lab", html);
};

const HOSPITAL_SERVICE_URL = process.env.HOSPITAL_SERVICE_URL || "http://hospital-service:3009";

// Helper: validate hospitalId exists in hospital-service
const validateHospital = async (hospitalId: number, authHeader: string): Promise<boolean> => {
  try {
    const res = await axios.get(`${HOSPITAL_SERVICE_URL}/hospital/${hospitalId}`, {
      timeout: 5000,
      headers: { Authorization: authHeader },
    });
    return res.status === 200 && res.data?.success === true;
  } catch (error: any) {
    console.error("Hospital Validation Error:", error.message);
    return false;
  }
};

// REGISTER - POST /lab/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, phone, emergencyContact, email, password, latitude, longitude, about, working_hours, web, hospitalId } = req.body;

  const exist = await Lab.findOne({ where: { phone: phone } });
  if (exist) {
    res.status(400).json({
      success: false,
      message: "Lab already exists",
      data: null,
      error: { code: "LAB_ALREADY_EXISTS", details: null },
    });
    return;
  }

  // Validate hospitalId and identity if provided
  if (hospitalId) {
    const authHeader = req.headers.authorization || "";
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Authentication token required when providing a hospitalId"
      });
      return;
    }

    // Decode token to verify identity
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "supersecretjwtkey");
      
      if (decoded.id !== hospitalId) {
        res.status(403).json({
          success: false,
          message: "Hospital identity mismatch. You can only register labs for your own hospital."
        });
        return;
      }
    } catch (err) {
      res.status(401).json({ success: false, message: "Invalid or expired hospital token" });
      return;
    }

    const hospitalExists = await validateHospital(hospitalId, authHeader);
    if (!hospitalExists) {
      res.status(404).json({
        success: false,
        message: `Hospital with ID ${hospitalId} does not exist`,
        data: null,
        error: { code: "HOSPITAL_NOT_FOUND", details: null },
      });
      return;
    }
  }

  const normalizedEmail = email?.trim().toLowerCase();

  const newLab = await Lab.create({
    name,
    phone,
    email: normalizedEmail,
    password,
    emergencyContact,
    latitude,
    longitude,
    about,
    working_hours,
    address,
    web,
    hospitalId,
  });

  await publishEvent("lab_events", "LAB_REGISTERED", {
    labId: newLab.id,
    phone: newLab.phone,
  });

  // Remove password from response
  const { password: _, ...labData } = newLab.toJSON();

  res.status(201).json({
    success: true,
    message: "Registration completed successfully",
    data: labData,
    error: null,
  });
});

// LOGIN - POST /lab/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    res.status(400).json({
      success: false,
      message: "Identifier (email/phone) and password are required",
    });
    return;
  }

  const normalizedEmail = email?.trim().toLowerCase();

  // Find lab by email OR phone
  const lab = await Lab.scope("withPassword").findOne({
    where: {
      [Op.or]: [
        normalizedEmail ? { email: normalizedEmail } : null,
        phone ? { phone } : null,
      ].filter(Boolean) as any,
    },
  });

  if (!lab) {
    res.status(401).json({
      success: false,
      message: "Lab not found! Please register",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, lab.password || "");
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
  const token = jwt.sign({ id: lab.id, name: lab.name, role: "lab", roleId: lab.roleId }, jwtKey, {
    expiresIn: "15m"
  });
  const refreshToken = jwt.sign({ id: lab.id, name: lab.name, role: "lab", roleId: lab.roleId }, jwtKey, {
    expiresIn: "7d"
  });

  setRefreshTokenCookie(res, refreshToken);

  // Remove password from response
  const { password: _, otp: __, otpExpiry: ___, ...safeLab } = lab.toJSON();

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    status: 200,
    token,
    data: safeLab,
    error: null,
  });
});

// LOGIN WITH PHONE (OTP REQUEST) - POST /lab/login/phone
export const loginWithPhone: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;

  let numericPhone = phone.replace(/\D/g, "").slice(-10);

  const lab = await Lab.findOne({ where: { phone: numericPhone } });
  if (!lab) {
    res.status(404).json({
      success: false,
      message: "Lab not found with this phone number",
    });
    return;
  }

  // Generate 6-digit OTP
  const otp = numericPhone === APPLE_TEST_NUMBER 
    ? APPLE_TEST_OTP 
    : Math.floor(100000 + Math.random() * 900000).toString();
    
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

  await lab.update({ otp, otpExpiry });

  if (numericPhone !== APPLE_TEST_NUMBER) {
    // Send OTP via Twilio
    const client = getTwilioClient();
    const twilioNumber = process.env.TWILIO_NUMBER;

    if (client && twilioNumber) {
      try {
        const toNumber = phone.startsWith("+") ? phone : `+91${numericPhone}`;

        await client.messages.create({
          body: `Your Hosta Lab verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioNumber,
          to: toNumber,
        });
      } catch (err: any) {
        console.error("Twilio Error:", err.message);
      }
    }

    // Send OTP via Email (if exists)
    if (lab.email) {
      try {
        await sendOtpEmail(lab.email, otp, lab.name);
      } catch (err: any) {
        console.error("Email OTP Error:", err.message);
      }
    }
  }

  res.status(200).json({
    success: true,
    message: numericPhone === APPLE_TEST_NUMBER ? "OTP sent (TEST ACCOUNT)" : "OTP sent to your registered phone and email",
    data: numericPhone === APPLE_TEST_NUMBER ? { otp: APPLE_TEST_OTP } : null,
  });
});

// SEND OTP (EMAIL) - POST /lab/auth/send-otp
export const sendOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: "Email is required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`Searching for Lab with email: "${normalizedEmail}"`);

  const lab = await Lab.findOne({ 
    where: { 
      email: normalizedEmail 
    } 
  });

  if (!lab) {
    console.log(`No Lab found for email: "${normalizedEmail}"`);
    res.status(404).json({ success: false, message: "Lab not found with this email" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await lab.update({ otp, otpExpiry });

  try {
    await sendOtpEmail(email, otp, lab.name);
    res.json({ success: true, message: "OTP sent to email" });
    return;
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send email" });
    return;
  }
});

// VERIFY OTP - POST /lab/auth/verify-otp & /lab/otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, email, otp } = req.body;

  if ((!phone && !email) || !otp) {
    res.status(400).json({ success: false, message: "Identifier (phone/email) and OTP are required" });
    return;
  }

  let lab;
  if (phone) {
    let numericPhone = phone.replace(/\D/g, "").slice(-10);
    lab = await Lab.scope("withPassword").findOne({ where: { phone: numericPhone } });
  } else if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    lab = await Lab.scope("withPassword").findOne({ where: { email: normalizedEmail } });
  }

  if (!lab || lab.otp !== otp.toString()) {
    res.status(400).json({ success: false, message: "Invalid OTP" });
    return;
  }

  if (lab.otpExpiry && new Date() > lab.otpExpiry) {
    res.status(400).json({ success: false, message: "OTP has expired" });
    return;
  }

  // Clear OTP fields after verification
  await lab.update({ otp: null, otpExpiry: null });

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: lab.id, name: lab.name, role: "lab", roleId: lab.roleId }, jwtKey, {
    expiresIn: "15m"
  });
  const refreshToken = jwt.sign({ id: lab.id, name: lab.name, role: "lab", roleId: lab.roleId }, jwtKey, {
    expiresIn: "7d"
  });

  setRefreshTokenCookie(res, refreshToken);

  const { password: _, otp: __, otpExpiry: ___, ...safeLab } = lab.toJSON();

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    data: safeLab,
  });
});

export const verifyLoginOtp = verifyOtp;

// RESET PASSWORD - POST /lab/auth/reset-password
export const resetPassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const lab = await Lab.scope("withPassword").findOne({ where: { email } });

  if (!lab || lab.otp !== otp.toString() || (lab.otpExpiry && new Date() > lab.otpExpiry)) {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    return;
  }

  lab.password = newPassword;
  lab.otp = null as any;
  lab.otpExpiry = null as any;

  await lab.save();

  res.json({ success: true, message: "Password reset successful" });
});

// CHANGE PASSWORD (JWT) - PUT /lab/auth/change-password
export const changepassword: any = asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const lab = await Lab.scope("withPassword").findByPk(req.user.id);
  if (!lab) {
    res.status(404).json({ success: false, message: "Lab not found" });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, lab.password || "");
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Incorrect current password" });
    return;
  }

  lab.password = newPassword;
  await lab.save();

  res.json({ success: true, message: "Password changed successfully" });
});

export const changePassword = changepassword;

// GET ONE - GET /lab/:id
export const getanLab: any = asyncHandler(async (req: Request, res: Response) => {
  const lab = await Lab.findByPk(req.params.id);
  if (!lab) {
    res.status(404).json({
      success: false,
      message: "Lab not found",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  // Remove password from response
  const { password: _, ...safeLab } = lab.toJSON();

  res.status(200).json({
    success: true,
    status: "Success",
    data: safeLab,
    error: null,
  });
});

// UPDATE - PUT /lab/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Whitelist fields to prevent Mass Assignment
  const { name, address, phone, emergencyContact, email, latitude, longitude, about, working_hours, web, hospitalId } = req.body;
  const updatePayload = { name, address, phone, emergencyContact, email, latitude, longitude, about, working_hours, web, hospitalId };

  // Validate hospitalId if being updated
  if (hospitalId) {
    const authHeader = req.headers.authorization || "";
    const hospitalExists = await validateHospital(hospitalId, authHeader);
    if (!hospitalExists) {
      res.status(404).json({
        success: false,
        message: `Hospital with ID ${hospitalId} does not exist`,
        data: null,
        error: { code: "HOSPITAL_NOT_FOUND", details: null },
      });
      return;
    }
  }

  const [affectedCount, affectedRows] = await Lab.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (affectedCount === 0) {
    res.status(404).json({
      success: false,
      message: "Lab not found",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  const updatedLab = affectedRows[0].toJSON();
  delete (updatedLab as any).password;

  await publishEvent("lab_events", "LAB_UPDATED", {
    labId: updatedLab.id,
  });

  res.status(200).json({
    success: true,
    message: "Successfully updated",
    data: updatedLab,
    error: null,
  });
});

// DELETE - DELETE /lab/:id
export const labDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const lab = await Lab.findByPk(id);
  if (!lab) {
    res.status(404).json({
      success: false,
      message: "Lab not found",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  // Perform soft delete
  await Lab.destroy({
    where: { id: id },
  });

  // Also update custom status flags for backward compatibility
  await lab.update({
    isDelete: true,
    isActive: false,
    deleteDate: new Date()
  });

  await publishEvent("lab_events", "LAB_DELETED", {
    labId: id,
  });

  res.status(200).json({
    success: true,
    message: "Your account deleted successfully",
    data: null,
    error: null,
  });
});

// GET ALL - GET /lab
export const getLabs: any = asyncHandler(async (req: Request, res: Response) => {
  const labs = await Lab.findAll();

  if (labs.length === 0) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "NO_DATA_FOUND", details: null },
    });
    return;
  }

  const safeLabs = labs.map(lab => {
    const json = lab.toJSON();
    delete (json as any).password;
    return json;
  });

  res.status(200).json({
    success: true,
    status: "Success",
    data: safeLabs,
    error: null,
  });
});

// REFRESH TOKEN - POST /lab/refresh
export const refreshLabToken: any = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "Refresh token missing" });
    return;
  }

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";

  try {
    const decoded: any = jwt.verify(refreshToken, jwtKey);
    
    const lab = await Lab.findByPk(decoded.id);

    if (!lab) {
      res.status(401).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const newToken = jwt.sign({ id: lab.id, name: lab.name, role: "lab", roleId: lab.roleId }, jwtKey, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign({ id: lab.id, name: lab.name, role: "lab", roleId: lab.roleId }, jwtKey, {
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

// LOGOUT - POST /lab/logout
export const logout: any = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});