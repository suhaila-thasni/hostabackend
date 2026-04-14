import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import twilio from "twilio";
import Staff from "../models/staff.model";
import { publishEvent } from "../events/publisher";
import { logger } from "../utils/logger";

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

// REGISTER - POST /staff/register                             
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  
  const { name, phone, email, password,  designation, joiningDate, jobType, staffType,  dob, gender, knowLanguages, qualification, address } = req.body;


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
      name, phone, email, password, dob, gender, 
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
  const token = jwt.sign({ id: staff.id, name: staff.name }, jwtKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: staff.id, name: staff.name },
    jwtKey,
    { expiresIn: "7d" }
  );

  const sevenDayInMs = 7 * 24 * 60 * 60 * 1000;
  const expirationDate = new Date(Date.now() + sevenDayInMs);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    expires: expirationDate,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

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

  const token = jwt.sign({ id: staff.id, name: staff.name }, jwtKey, { expiresIn: "15m" });

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