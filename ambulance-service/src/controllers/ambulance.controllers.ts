import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Ambulance from "../models/ambulance.model";
import { publishEvent } from "../events/publisher";
import { generateToken } from "../services/jwt.service";
import twilio from "twilio";
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

// Helper for Twilio Client
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return null;
  }
  return twilio(sid, token);
};

import { httpClient } from "../utils/httpClient";

// REGISTER - POST /ambulance/register
export const Registeration: any = asyncHandler(async (req: any, res: Response) => {
  const { serviceName, address, phone, vehicleType, userId: bodyUserId } = req.body;
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

  const exist = await Ambulance.findOne({ where: { phone: phone } });
  if (exist) {
    res.status(400).json({
      success: false,
      message: "Ambulance already exists",
      data: null,
      error: { code: "AMBULANCE_ALREADY_EXISTS", details: null },
    });
    return;
  }

  const newAmbulance = await Ambulance.create({
    serviceName: serviceName,
    address: address,
    phone: phone,
    vehicleType: vehicleType,
    userId: req.user.id, // Linked to User account
  });

  await publishEvent("ambulance_events", "AMBULANCE_REGISTERED", {
    ambulanceId: newAmbulance.id,
    phone: newAmbulance.phone,
  });

  const ambulanceData = newAmbulance.toJSON();

  res.status(201).json({
    success: true,
    message: "Registration completed successfully",
    data: ambulanceData,
    error: null,
  });
});


// LOGIN WITH PHONE (OTP REQUEST) - POST /ambulance/login/phone
export const loginWithPhone: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  let numericPhone = phone.replace(/\D/g, "").slice(-10);

  if (!numericPhone) {
    res.status(400).json({ success: false, message: "Invalid phone number" });
    return;
  }

  const ambulance = await Ambulance.scope("withPassword").findOne({ where: { phone: numericPhone } });
  if (!ambulance) {
    res.status(404).json({
      success: false,
      message: "Ambulance not found with this phone number",
    });
    return;
  }

  // Generate 6-digit OTP
  const otp = numericPhone === APPLE_TEST_NUMBER 
    ? APPLE_TEST_OTP 
    : Math.floor(100000 + Math.random() * 900000).toString();
  
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

  await ambulance.update({ otp, otpExpiry });

  // Send OTP via Twilio
  if (numericPhone !== APPLE_TEST_NUMBER) {
    try {
        const client = getTwilioClient();
        const twilioNumber = process.env.TWILIO_NUMBER;

        if (client && twilioNumber) {
            const targetNumber = phone.startsWith("+") ? phone : `+91${numericPhone}`;
            await client.messages.create({
                body: `Your Hosta Ambulance verification code is: ${otp}. Valid for 10 minutes.`,
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

// VERIFY OTP - POST /ambulance/otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  let numericPhone = phone.replace(/\D/g, "").slice(-10);

  const ambulance = await Ambulance.scope("withPassword").findOne({ where: { phone: numericPhone } });

  if (!ambulance || ambulance.otp !== otp || (ambulance.otpExpiry && new Date() > ambulance.otpExpiry)) {
    res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
    return;
  }

  // Clear OTP fields after verification
  await ambulance.update({ otp: null as any, otpExpiry: null as any });

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: ambulance.id, name: ambulance.serviceName, role: "ambulance", roleId: ambulance.roleId }, jwtKey, {
    expiresIn: "15m"
  });
  const refreshToken = jwt.sign({ id: ambulance.id, name: ambulance.serviceName, role: "ambulance", roleId: ambulance.roleId }, jwtKey, {
    expiresIn: "7d"
  });

  setRefreshTokenCookie(res, refreshToken);

  const ambulanceJson = ambulance.toJSON();
  
  delete (ambulanceJson as any).otp;
  delete (ambulanceJson as any).otpExpiry;

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    data: ambulanceJson,
  });
});

// GET ONE - GET /ambulance/:id
export const getanAmbulace: any = asyncHandler(async (req: Request, res: Response) => {
  const user = await Ambulance.findByPk(req.params.id);
  if (!user) {
    res.status(404).json({
      success: false,
      message: "Ambulance not found",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  const safeUser = user.toJSON();

  res.status(200).json({
    success: true,
    status: "Success",
    data: safeUser,
    error: null,
  });
});

// UPDATE - PUT /ambulance/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Whitelist fields to prevent Mass Assignment
  const { serviceName, address, phone, vehicleType } = req.body;
  const updatePayload = { serviceName, address, phone, vehicleType };

  const [affectedCount, affectedRows] = await Ambulance.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (affectedCount === 0) {
    res.status(404).json({
      success: false,
      message: "Ambulance not found",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  const updatedAmbulance = affectedRows[0].toJSON();

  await publishEvent("ambulance_events", "AMBULANCE_UPDATED", {
    ambulanceId: updatedAmbulance.id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: updatedAmbulance,
    error: null,
  });
});

// DELETE - DELETE /ambulance/:id
export const ambulanceDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ambulance = await Ambulance.findByPk(id);
  if (!ambulance) {
    res.status(404).json({
      success: false,
      message: "Ambulance not found",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  await Ambulance.destroy({
    where: { id: id }
  });

  await publishEvent("ambulance_events", "AMBULANCE_DELETED", {
    ambulanceId: id,
  });

  res.status(200).json({
    success: true,
    message: "Your account deleted successfully",
    data: null,
    error: null,
  });
});

// GET ALL - GET /ambulance
export const getAmbulaces: any = asyncHandler(async (req: Request, res: Response) => {
  const ambulances = await Ambulance.findAll();

  if (ambulances.length === 0) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "NO_DATA_FOUND", details: null },
    });
    return;
  }

  const safeAmbulances = ambulances.map(ambulance => {
    return ambulance.toJSON();
  });

  res.status(200).json({
    success: true,
    status: "Success",
    data: safeAmbulances,
    error: null,
  });
});

// REFRESH TOKEN - POST /ambulance/refresh
export const refreshAmbulanceToken: any = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: "Refresh token missing" });
    return;
  }

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";

  try {
    const decoded: any = jwt.verify(refreshToken, jwtKey);
    
    const ambulance = await Ambulance.findByPk(decoded.id);

    if (!ambulance) {
      res.status(401).json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const newToken = jwt.sign({ id: ambulance.id, name: ambulance.serviceName, role: "ambulance", roleId: ambulance.roleId }, jwtKey, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign({ id: ambulance.id, name: ambulance.serviceName, role: "ambulance", roleId: ambulance.roleId }, jwtKey, {
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

// LOGOUT - POST /ambulance/logout
export const logout: any = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});