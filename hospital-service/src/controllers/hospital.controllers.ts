import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Hospital from "../models/hospital.model";
import { publishEvent } from "../events/publisher";

// REGISTER - POST /hospital/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, address, phone, emergencyContact, email, password, latitude, longitude,  about,  working_hours_clinic, working_hours_general } = req.body;


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
  const { email, password } = req.body;

  const hospital = await Hospital.findOne({ where: { email: email } });
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Hospital not found! Please register",
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, hospital.password || "");
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
  const token = jwt.sign({ id: hospital.id, name: hospital.name }, jwtKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: hospital.id, name: hospital.name },
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
    data: hospital,
    error: null,
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
  const updatePayload = req.body;

  const hospital = await Hospital.findByPk(id);
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Doctor not found",
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }


    await Hospital.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  res.status(200).json({
    success: true,
    message: "Your account deleted successfully",
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

// FORGET PASSWORD - POST /hospital/forgot
export const forgetpassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const hospital = await Hospital.findOne({ where: { email } });
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: hospital,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /hospital/changepassword
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { password, email } = req.body;

  const hospital = await Hospital.findOne({ where: { email } });
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "HOSPITAL_NOT_FOUND", details: null },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  hospital.password = hashedPassword;

  await hospital.save();

  res.status(200).json({
    success: true,
    status: 200,
    data: hospital,
    error: null,
  });
});