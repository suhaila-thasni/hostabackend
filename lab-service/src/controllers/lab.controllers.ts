import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Lab from "../models/lab.model";
import { publishEvent } from "../events/publisher";

// REGISTER - POST /lab/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { name,  address, phone, emergencyContact, email, password, latitude, longitude,  about,  working_hours, web, hospitalId } = req.body;


  const exist = await Lab.findOne({ where: { phone: phone } });
  if (exist) {
    res.status(404).json({
      success: false,
      message: "Lab is already exist",
      data: null,
      error: { code: "LAB_ALREADY_EXISTS", details: null },
    });
    return;
  }

  const newLab = await Lab.create({
   name, 
   phone, 
   email, 
   password, 
   emergencyContact,
   latitude,
   longitude,
   about,
   working_hours,
   address, 
   web,
   hospitalId
  });

  await publishEvent("lab_events", "LAB_REGISTERED", {
    labId: newLab.id,
    phone: newLab.phone,
  });

  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: null,
    error: null,
  });
});

// LOGIN - POST /lab/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const lab = await Lab.findOne({ where: { email: email } });
  if (!lab) {
    res.status(404).json({
      success: false,
      message: "Lab not found! Please register",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, lab.password || "");
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
  const token = jwt.sign({ id: lab.id, name: lab.name }, jwtKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: lab.id, name: lab.name },
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
    data: lab,
    error: null,
  });
});

// GET ONE - GET /lab/:id
export const getanLab : any = asyncHandler(async (req: Request, res: Response) => {
  const lab = await  Lab.findByPk(req.params.id);
  if (!lab) {
    res.status(404).json({
      success: false,
      message: "Lab not found",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: lab,
    error: null,
  });
});

// UPDATE - PUT /lab/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const lab = await Lab.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!lab[1] || lab[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Lab not found",
      status: 200,
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("lab_events", "LAB_UPDATED", {
    LabId: lab[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: lab[1][0],
    error: null,
  });
});

// DELETE - DELETE /lab/:id
export const labDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

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


    await lab.update(updatePayload, {
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

// GET ALL - GET /lab 
export const getLab: any = asyncHandler(async (req: Request, res: Response) => {
  const lab = await Lab.findAll();
  

  if (lab.length === 0) {
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
    data: lab,
    error: null,
  });
});

// FORGET PASSWORD - POST /lab/forgot
export const forgetpassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const lab = await Lab.findOne({ where: { email } });
  if (!lab) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: lab,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /lab/changepassword
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { password, email } = req.body;

  const lab = await Lab.findOne({ where: { email } });
  if (!lab) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "LAB_NOT_FOUND", details: null },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  lab.password = hashedPassword;

  await lab.save();

  res.status(200).json({
    success: true,
    status: 200,
    data: lab,
    error: null,
  });
});