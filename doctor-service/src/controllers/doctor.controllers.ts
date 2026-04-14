import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Doctor from "../models/doctor.model";
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

// REGISTER - POST /doctor/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone, joiningDate,  email, password, fees, department, specialist, dob, gender, knowLanguages, consulting, bookingOpen, qualification, address, displayName } = req.body;


  const exist = await Doctor.findOne({ where: { phone: phone } });
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
   phone, 
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
   joiningDate
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

  const doctor = await Doctor.findOne({ where: { phone } });
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

  await Doctor.update({ otp, otpExpiry }, { where: { phone } });

  // Send OTP via Twilio
  const client = getTwilioClient();
  const twilioNumber = process.env.TWILIO_NUMBER;

  if (client && twilioNumber) {
    try {
      await client.messages.create({
        body: `Your Hosta Doctor verification code is: ${otp}. Valid for 10 minutes.`,
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

// VERIFY OTP - POST /doctor/otp
export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  const doctor = await Doctor.scope("withPassword").findOne({ where: { phone } });

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

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  doctor.password = hashedPassword;
  await doctor.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});