import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Doctor from "../models/doctor.model";
import { publishEvent } from "../events/publisher";

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
  const { email, password } = req.body;

  const doctor = await Doctor.findOne({ where: { email: email } });
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "Doctor not found! Please register",
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, doctor.password || "");
  if (!checkPassword) {
    res.status(404).json({
      success: false,
      message: "Wrong password, Plese try again",
      data: null,
      error: { code: "WRONG_PASSWORD", details: null },
    });
    return;
  }

  const jwtKey = process.env.JWT_SECRET;
  if (!jwtKey) {
    res.status(404).json({
      success: false,
      message: "JWT_SECRET is not defined",
      data: null,
      error: { code: "JWT_SECRET_NOT_DEFINED", details: null },
    });
    return;
  }

  // Generate JWT tokens
  const token = jwt.sign({ id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}`}, jwtKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: doctor.id, name: `${doctor.firstName} ${doctor.lastName}` },
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
    message: "Loggedin successfully",
    status: 200,
    data: doctor,
    error: null,
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

// FORGET PASSWORD - POST /doctor/forgot
export const forgetpassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const doctor = await Doctor.findOne({ where: { email } });
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: doctor,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /doctor/changepassword
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { password, email } = req.body;

  const doctor = await Doctor.findOne({ where: { email } });
  if (!doctor) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "DOCTOR_NOT_FOUND", details: null },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  doctor.password = hashedPassword;

  await doctor.save();

  res.status(200).json({
    success: true,
    status: 200,
    data: doctor,
    error: null,
  });
});