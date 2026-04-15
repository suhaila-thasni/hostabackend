import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Hospital from "../models/hospital.model";
import { publishEvent } from "../events/publisher";
import { Op } from "sequelize";
import twilio from "twilio";

// Helper for Twilio Client
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    return null;
  }
  return twilio(sid, token);
};

// REGISTER - POST /hospital/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, address, phone, emergencyContact, email, password, latitude, longitude,  about,  working_hours_clinic, working_hours_general,  working_hours_clinic_nobreak } = req.body;


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
   working_hours_clinic_nobreak
  });

  await publishEvent("hospital_events", "HOSPITAL_REGISTERED", {
    doctorId: newHospital.id,
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
  const token = jwt.sign({ id: hospital.id, name: hospital.name }, jwtKey, {
    expiresIn: "24h",
  });

  // Remove password and OTP fields from response
  const { password: _, otp: __, otpExpiry: ___, ...safeHospital } = hospital.get();

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

  const hospital = await Hospital.findOne({ where: { phone } });
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Hospital not found with this phone number",
    });
    return;
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

  await Hospital.update({ otp, otpExpiry }, { where: { phone } });

  // Send OTP via Twilio
  const client = getTwilioClient();
  const twilioNumber = process.env.TWILIO_NUMBER;

  if (client && twilioNumber) {
    try {
      await client.messages.create({
        body: `Your Hosta Hospital verification code is: ${otp}. Valid for 10 minutes.`,
        from: twilioNumber,
        to: phone,
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

// VERIFY OTP - POST /hospital/otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  const hospital = await Hospital.scope("withPassword").findOne({ where: { phone } });

  if (!hospital || hospital.otp !== otp || (hospital.otpExpiry && new Date() > hospital.otpExpiry)) {
    res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
    return;
  }

  // Clear OTP fields after verification
  await hospital.update({ otp: null, otpExpiry: null });

  const jwtKey = process.env.JWT_SECRET || "supersecretjwtkey";
  const token = jwt.sign({ id: hospital.id, name: hospital.name }, jwtKey, {
    expiresIn: "24h",
  });

  const { password: _, otp: __, otpExpiry: ___, ...safeHospital } = hospital.get();

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    token,
    data: safeHospital,
  });
});

// GET ONE - GET /hospital/:id
export const getanHospital : any = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await  Hospital.findByPk(req.params.id);
  if (!doctor) {
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
    data: doctor,
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

// CHANGE PASSWORD - PUT /hospital/password
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword, email } = req.body;

  const hospital = await Hospital.scope("withPassword").findOne({ where: { email } });
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Hospital not found",
    });
    return;
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, hospital.password || "");
  if (!isMatch) {
    res.status(401).json({
      success: false,
      message: "Incorrect current password",
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  hospital.password = hashedPassword;
  await hospital.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});