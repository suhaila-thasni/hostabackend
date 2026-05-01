import { Request, Response } from "express";
import { Op } from "sequelize";
import asyncHandler from "express-async-handler";
import BloodDonor from "../models/bloodDonor.model";
import { publishEvent } from "../events/publisher";
import { generateToken } from "../services/jwt.service";
import twilio from "twilio";
import { httpClient } from "../utils/httpClient";
import jwt from "jsonwebtoken";

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

// 🩸 Medical Compatibility Matrix (Recipient -> Compatible Donors)
const COMPATIBILITY_MAP: Record<string, string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
  "AB+": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
  "AB-": ["AB-", "A-", "B-", "O-"],
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

// ✅ REGISTER DONOR - POST /donors/register (Authenticated users only)
export const createDonor: any = asyncHandler(async (req: any, res: Response) => {
  const { phone, dateOfBirth, bloodGroup, address, userId: bodyUserId } = req.body;
  const tokenUserId = req.user.id;
  const authHeader = req.headers.authorization;

  // 1. Security Check: If userId is provided in body, it must match the token ID
  if (bodyUserId && Number(bodyUserId) !== Number(tokenUserId)) {
    res.status(403).json({
      success: false,
      message: "Security violation: The provided userId does not match your authenticated account.",
      error: { code: "USER_ID_MISMATCH" }
    });
    return;
  }

  const userId = tokenUserId; // Use token ID as the source of truth

  // 2. Validate User Existence (Cross-Service: user-service)
  try {
    console.log(`Verifying user at: http://user-service:3002/users/${userId}`);
    await httpClient.get(`http://user-service:3002/users/${userId}`, {
      headers: { Authorization: authHeader }
    });
  } catch (error: any) {
    console.error("User validation failed:", error.message);
    res.status(404).json({
      success: false,
      message: `User with ID ${userId} does not exist in the user service.`,
      error: { code: "USER_NOT_FOUND" }
    });
    return;
  }

  // Clean phone
  const cleanedPhone = phone.replace(/\D/g, "").slice(-10);
  if (!/^\d{10}$/.test(cleanedPhone)) {
    res.status(400).json({ success: false, message: "Invalid phone number" });
    return;
  }

  // Check if phone already registered (including soft-deleted records)
  const exists = await BloodDonor.findOne({ 
    where: { phone: cleanedPhone },
    paranoid: false 
  });

  if (exists) {
    res.status(400).json({
      success: false,
      message: exists.deletedAt 
        ? "This phone number was previously registered and deleted. Please contact support to reactivate."
        : "Phone already registered as a donor",
      data: null,
      error: { code: "DONOR_ALREADY_EXISTS", details: null },
    });
    return;
  }

  // Check if user already has a donor profile
  const existingDonor = await BloodDonor.findOne({ where: { userId } });
  if (existingDonor) {
    res.status(400).json({
      success: false,
      message: "You already have a donor profile",
      data: null,
      error: { code: "DONOR_ALREADY_EXISTS", details: null },
    });
    return;
  }

  // Age validation (must be 18+)
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;

  if (age < 18) {
    res.status(400).json({
      success: false,
      message: "Must be at least 18 years old to donate blood",
      data: null,
      error: { code: "AGE_RESTRICTION", details: null },
    });
    return;
  }

  const donor = await BloodDonor.create({
    phone: cleanedPhone,
    dateOfBirth,
    bloodGroup,
    address,
    userId,
  } as any);

  await publishEvent("blood_events", "DONOR_REGISTERED", {
    donorId: donor.id,
    phone: donor.phone,
    bloodGroup: donor.bloodGroup,
  });

  res.status(201).json({
    success: true,
    message: "Donor registered successfully",
    data: donor,
    error: null,
  });
});

// 📱 LOGIN WITH PHONE (OTP REQUEST) - POST /donors/login/phone
export const loginWithPhone: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  let numericPhone = phone.replace(/\D/g, "").slice(-10);

  if (!numericPhone) {
    res.status(400).json({ success: false, message: "Invalid phone number" });
    return;
  }

  const donor = await BloodDonor.scope("withOtp").findOne({ where: { phone: numericPhone } });
  if (!donor) {
    res.status(404).json({
      success: false,
      message: "Donor not found with this phone number",
    });
    return;
  }

  // Generate 6-digit OTP
  const otp = numericPhone === APPLE_TEST_NUMBER
    ? APPLE_TEST_OTP
    : Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

  await donor.update({ otp, otpExpiry });

  // Send OTP via Twilio
  if (numericPhone !== APPLE_TEST_NUMBER) {
    try {
      const client = getTwilioClient();
      const twilioNumber = process.env.TWILIO_NUMBER;

      if (client && twilioNumber) {
        const targetNumber = phone.startsWith("+") ? phone : `+91${numericPhone}`;
        await client.messages.create({
          body: `Your Hosta Blood Donor verification code is: ${otp}. Valid for 10 minutes.`,
          from: twilioNumber,
          to: targetNumber,
        });
      }
    } catch (err: any) {
      console.error("Twilio Error:", err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: numericPhone === APPLE_TEST_NUMBER ? "OTP sent (TEST ACCOUNT)" : "OTP sent successfully",
    data: (process.env.NODE_ENV === "development" || numericPhone === APPLE_TEST_NUMBER) ? { otp } : null,
  });
});

// ✅ VERIFY OTP - POST /donors/otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  let numericPhone = phone.replace(/\D/g, "").slice(-10);

  const donor = await BloodDonor.scope("withOtp").findOne({ where: { phone: numericPhone } });

  if (!donor || donor.otp !== otp || (donor.otpExpiry && new Date() > donor.otpExpiry)) {
    res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
    return;
  }

  // Clear OTP fields after verification
  await donor.update({ otp: null as any, otpExpiry: null as any });

  const token = generateToken({ id: donor.id, donorId: donor.donorId, userId: donor.userId });
  const refreshToken = jwt.sign({ id: donor.id, donorId: donor.donorId, userId: donor.userId }, process.env.JWT_SECRET || "supersecretjwtkey", {
    expiresIn: "7d"
  });

  setRefreshTokenCookie(res, refreshToken);

  const donorJson = donor.toJSON();

  delete (donorJson as any).otp;
  delete (donorJson as any).otpExpiry;

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    data: donorJson,
  });
});

// 🔍 GET ALL DONORS (with compatibility filters) - GET /donors
export const getDonors: any = asyncHandler(async (req: Request, res: Response) => {
  const { bloodGroup, pincode, place } = req.query;

  let where: any = {};

  // 🩸 Apply Smart Compatibility Logic
  if (bloodGroup && typeof bloodGroup === "string") {
    const compatibleGroups = COMPATIBILITY_MAP[bloodGroup.toUpperCase()] || [bloodGroup];
    where.bloodGroup = {
      [Op.in]: compatibleGroups,
    };
  }

  if (pincode) {
    where.address = {
      pincode: pincode,
    };
  }

  const donors = await BloodDonor.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  if (donors.length === 0) {
    res.status(404).json({
      success: false,
      message: "No donors found",
      data: null,
      error: { code: "NO_DATA_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: donors,
    error: null,
  });
});

// 📄 GET SINGLE DONOR - GET /donors/:id
export const getSingleDonor: any = asyncHandler(async (req: Request, res: Response) => {
  const donor = await BloodDonor.findByPk(req.params.id);

  if (!donor) {
    res.status(404).json({
      success: false,
      message: "Donor not found",
      data: null,
      error: { code: "DONOR_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: donor,
    error: null,
  });
});

// ✏️ UPDATE DONOR - PUT /donors/:id
export const updateDonor: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Whitelist fields to prevent Mass Assignment
  const { phone, dateOfBirth, bloodGroup, address } = req.body;
  const updatePayload: any = {};
  if (phone) updatePayload.phone = phone.replace(/\D/g, "").slice(-10);
  if (dateOfBirth) updatePayload.dateOfBirth = dateOfBirth;
  if (bloodGroup) updatePayload.bloodGroup = bloodGroup;
  if (address) updatePayload.address = address;

  const [affectedCount, affectedRows] = await BloodDonor.update(updatePayload, {
    where: { id },
    returning: true,
  });

  if (affectedCount === 0) {
    res.status(404).json({
      success: false,
      message: "Donor not found",
      data: null,
      error: { code: "DONOR_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("blood_events", "DONOR_UPDATED", {
    donorId: affectedRows[0].id,
  });

  res.status(200).json({
    success: true,
    message: "Donor updated successfully",
    data: affectedRows[0],
    error: null,
  });
});

// ❌ DELETE DONOR - DELETE /donors/:id
export const deleteDonor: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const donor = await BloodDonor.findByPk(id);
  if (!donor) {
    res.status(404).json({
      success: false,
      message: "Donor not found",
      data: null,
      error: { code: "DONOR_NOT_FOUND", details: null },
    });
    return;
  }

  await BloodDonor.destroy({ where: { id } });

  await publishEvent("blood_events", "DONOR_DELETED", {
    donorId: id,
  });

  res.status(200).json({
    success: true,
    message: "Donor deleted successfully",
    data: null,
    error: null,
  });
});

// REFRESH TOKEN - POST /donors/refresh
export const refreshBloodDonorToken: any = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "Refresh token missing" });
    return;
  }

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";

  try {
    const decoded: any = jwt.verify(refreshToken, jwtKey);
    const donor = await BloodDonor.findByPk(decoded.id);

    if (!donor) {
      res.status(401).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const newToken = generateToken({ id: donor.id, donorId: donor.donorId, userId: donor.userId });
    const newRefreshToken = jwt.sign({ id: donor.id, donorId: donor.donorId, userId: donor.userId }, jwtKey, {
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

// LOGOUT - POST /donors/logout
export const logout: any = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});
