import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Doctor from "../models/doctor.model";
import { publishEvent } from "../events/publisher";
import { Op } from "sequelize";
import twilio from "twilio";
import axios from "axios";
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

// Helper for Twilio Client
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return null;
  }
  return twilio(sid, token);
};

export const sendDoctorOtpEmail = async (email: string, otp: string, doctorName: string) => {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background-color: #17a2b8; padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Hosta Doctor</h1>
      </div>
      <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello <strong>Dr. ${doctorName}</strong>,</p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">Use the following security code to complete your verification. This code is valid for <strong>10 minutes</strong>.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; background-color: #f8f9fa; border: 2px dashed #17a2b8; border-radius: 8px; padding: 20px 40px; font-size: 32px; font-weight: bold; color: #17a2b8; letter-spacing: 8px;">
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

  await sendEmail(email, "Your Verification Code - Hosta Doctor", html);
};

// REGISTER - POST /doctor/register
export const Registeration: any = asyncHandler(async (req: any, res: Response) => {
  const { hospitalId: bodyHospitalId, firstName, lastName, phone, joiningDate, email, password, fees, department, specialist, dob, gender, knowLanguages, consulting, bookingOpen, qualification, address, displayName, outDoorConsulting } = req.body;

  const tokenHospitalId = req.user?.id;
  const authHeader = req.headers.authorization;

  // 1. Security Check: hospitalId in body must match token ID
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
    const hospitalResponse = await axios.get(`http://hospital-service:3009/hospital/${hospitalId}`, {
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

  const numericPhone = phone.replace(/\D/g, "").slice(-10);
  const exist = await Doctor.findOne({ where: { phone: numericPhone } });
  if (exist) {
    res.status(404).json({
      success: false,
      message: "Doctor is already exist",
      data: null,
      error: { code: "DOCTOR_ALREADY_EXISTS", details: null },
    });
    return;
  }

  const newDoctor = await Doctor.create({
   firstName, 
   lastName, 
   phone: numericPhone, 
   email, 
   password, 
   fees, 
   department, 
   specialist, 
   dob, 
   gender, 
   knowLanguages, 
   consulting, 
   bookingOpen, 
   qualification, 
   address, 
   displayName,
   joiningDate,
   outDoorConsulting,
   hospitalId
  });

  await publishEvent("doctor_events", "DOCTOR_REGISTERED", {
    doctorId: newDoctor.id,
    phone: newDoctor.phone,
  });

  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: null,
    error: null,
  });
});

// LOGIN - POST /doctor/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    res.status(400).json({
      success: false,
      message: "Identifier (email/phone) and password are required",
    });
    return;
  }

  // Find doctor by email OR phone
  const doctor = await Doctor.scope("withPassword").findOne({
    where: {
      [Op.or]: [
        email ? { email } : null,
        phone ? { phone } : null,
      ].filter(Boolean) as any,
    },
  });

  if (!doctor) {
    res.status(401).json({
      success: false,
      message: "Doctor not found! Please register",
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, doctor.password || "");
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
  const token = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}`}, jwtKey, {
    expiresIn: "24h",
  });

  // Remove password and OTP fields from response
  const { password: _, otp: __, otpExpiry: ___, ...safeDoctor } = doctor.get();

  const refreshToken = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}` }, jwtKey, {
    expiresIn: "7d",
  });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    status: 200,
    token, // Return token for API Gateway forwarding
    data: safeDoctor,
    error: null,
  });
});

// LOGIN WITH PHONE (OTP REQUEST) - POST /doctor/login/phone
export const loginWithPhone: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const numericPhone = phone.replace(/\D/g, "").slice(-10);
  const doctor = await Doctor.findOne({ where: { phone: numericPhone } });
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "Doctor not found with this phone number",
    });
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

  await Doctor.update({ otp, otpExpiry }, { where: { phone: numericPhone } });

  // Send OTP via Twilio
  const client = getTwilioClient();
  const twilioNumber = process.env.TWILIO_NUMBER;

  if (client && twilioNumber) {
    try {
      const targetNumber = phone.startsWith("+") ? phone : `+91${numericPhone}`;
      await client.messages.create({
        body: `Your Hosta Doctor verification code is: ${otp}. Valid for 10 minutes.`,
        from: twilioNumber,
        to: targetNumber,
      });
    } catch (err: any) {
      console.error("Twilio Error:", err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: process.env.NODE_ENV === "development" ? { otp } : null,
  });
});

// VERIFY OTP - POST /doctor/otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  let numericPhone = phone.replace(/\D/g, "").slice(-10);
  const doctor = await Doctor.scope("withPassword").findOne({ where: { phone: numericPhone } });

  if (!doctor || doctor.otp !== otp || (doctor.otpExpiry && new Date() > doctor.otpExpiry)) {
    res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
    return;
  }

  // Clear OTP fields after verification
  await doctor.update({ otp: null, otpExpiry: null });

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}`}, jwtKey, {
    expiresIn: "24h",
  });

  const { password: _, otp: __, otpExpiry: ___, ...safeDoctor } = doctor.get();

  const refreshToken = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}`}, jwtKey, {
    expiresIn: "7d",
  });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    data: safeDoctor,
  });
});

// GET ONE - GET /doctor/:id
export const getanDoctor : any = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await Doctor.findByPk(req.params.id);
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "Doctor not found",
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: doctor,
    error: null,
  });
});

// UPDATE - PUT /doctor/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const doctor = await Doctor.update(updatePayload, {
    where: { id: id },
    returning: true,
    individualHooks: true, // 🔥 Ensure password hashing hooks are triggered
  });

  if (!doctor[1] || doctor[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Doctor not found",
      status: 200,
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("doctor_events", "DOCTOR_UPDATED", {
    doctorId: doctor[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: doctor[1][0],
    error: null,
  });
});

// DELETE - DELETE /doctor/:id
export const doctorDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const doctor = await Doctor.findByPk(id);
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "Doctor not found",
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  // 🔥 Perform Soft Delete (requires paranoid: true in model)
  await doctor.destroy();

  await publishEvent("doctor_events", "DOCTOR_DELETED", {
    doctorId: id,
  });

  res.status(200).json({
    success: true,
    message: "Doctor account soft-deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});


// GET ALL - GET /doctor
export const getDoctors: any = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await Doctor.findAll();

  if (doctor.length === 0) {
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
    data: doctor,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /doctor/password
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword, email } = req.body;

  const doctor = await Doctor.scope("withPassword").findOne({ where: { email } });
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "Doctor not found",
    });
    return;
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, doctor.password || "");
  if (!isMatch) {
    res.status(401).json({
      success: false,
      message: "Incorrect current password",
    });
    return;
  }

  // Set raw password; model hook handles hashing
  doctor.password = newPassword;
  await doctor.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

// SEND DOCTOR OTP (EMAIL) - POST /doctor/auth/send-otp
export const sendDoctorOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ success: false, message: "Email is required" });
    return;
  }

  const doctor = await Doctor.findOne({ where: { email } });
  if (!doctor) {
    res.status(404).json({ success: false, message: "Doctor not found with this email" });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await doctor.update({ otp, otpExpiry });

  try {
    await sendDoctorOtpEmail(email, otp, `${doctor.firstName} ${doctor.lastName}`);
    res.json({ success: true, message: "OTP sent to email" });
    return;
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send email" });
    return;
  }
});

// VERIFY DOCTOR OTP - POST /doctor/auth/verify-otp
export const verifyDoctorOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, email, otp } = req.body;

  if ((!phone && !email) || !otp) {
    res.status(400).json({ success: false, message: "Identifier (phone/email) and OTP are required" });
    return;
  }

  let doctor;
  if (phone) {
    let numericPhone = phone.replace(/\D/g, "").slice(-10);
    doctor = await Doctor.scope("withPassword").findOne({ where: { phone: numericPhone } });
  } else if (email) {
    doctor = await Doctor.scope("withPassword").findOne({ where: { email } });
  }

  if (!doctor || doctor.otp !== otp.toString()) {
    res.status(400).json({ success: false, message: "Invalid OTP" });
    return;
  }

  if (doctor.otpExpiry && new Date() > doctor.otpExpiry) {
    res.status(400).json({ success: false, message: "OTP has expired" });
    return;
  }

  // Clear OTP after successful verification
  await doctor.update({ otp: null, otpExpiry: null });

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}` }, jwtKey, {
    expiresIn: "24h",
  });

  const refreshToken = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}` }, jwtKey, {
    expiresIn: "7d",
  });

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({ 
    success: true, 
    message: "OTP verified",
    token,
    data: doctor 
  });
});

// RESET DOCTOR PASSWORD - POST /doctor/auth/reset-password
export const resetDoctorPassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const doctor = await Doctor.scope("withPassword").findOne({ where: { email } });

  if (!doctor || doctor.otp !== otp.toString() || (doctor.otpExpiry && new Date() > doctor.otpExpiry)) {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    return;
  }

  doctor.password = newPassword;
  doctor.otp = null as any;
  doctor.otpExpiry = null as any;

  await doctor.save();

  res.json({ success: true, message: "Password reset successful" });
});

// CHANGE DOCTOR PASSWORD (JWT) - PUT /doctor/auth/change-password
export const changeDoctorPassword: any = asyncHandler(async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const doctor = await Doctor.scope("withPassword").findByPk(req.user.id);
  if (!doctor) {
    res.status(404).json({ success: false, message: "Doctor not found" });
    return;
  }

  const isMatch = await bcrypt.compare(currentPassword, doctor.password || "");
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Incorrect current password" });
    return;
  }

  doctor.password = newPassword;
  await doctor.save();

  res.json({ success: true, message: "Password changed successfully" });
});

// REFRESH TOKEN - POST /doctor/refresh
export const refreshDoctorToken: any = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "Refresh token missing" });
    return;
  }

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";

  try {
    const decoded: any = jwt.verify(refreshToken, jwtKey);
    const doctor = await Doctor.findByPk(decoded.id);

    if (!doctor) {
      res.status(401).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const newToken = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}` }, jwtKey, {
      expiresIn: "24h",
    });
    const newRefreshToken = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}` }, jwtKey, {
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

// LOGOUT - POST /doctor/logout
export const logout: any = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});
