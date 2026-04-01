import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Ambulance from "../models/ambulance.model";
import { publishEvent } from "../events/publisher";

// REGISTER - POST /ambulance/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { serviceName, address, phone, vehicleType } = req.body;

  const exist = await Ambulance.findOne({ where: { phone: phone } });
  if (exist) {
    res.status(404).json({
      success: false,
      message: "Ambulance is already exist",
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
  });

  await publishEvent("ambulance_events", "AMBULANCE_REGISTERED", {
    ambulanceId: newAmbulance.id,
    phone: newAmbulance.phone,
  });

  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: null,
    error: null,
  });
});

// LOGIN - POST /ambulance/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await Ambulance.findOne({ where: { email: email } });
  if (!user) {
    res.status(404).json({
      success: false,
      message: "Ambulance not found! Please register",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, user.password || "");
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
  const token = jwt.sign({ id: user.id, name: user.serviceName }, jwtKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: user.id, name: user.serviceName },
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
    data: user,
    error: null,
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

  res.status(200).json({
    success: true,
    status: "Success",
    data: user,
    error: null,
  });
});

// UPDATE - PUT /ambulance/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const ambulance = await Ambulance.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!ambulance[1] || ambulance[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Ambulance not found",
      status: 200,
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("ambulance_events", "AMBULANCE_UPDATED", {
    ambulanceId: ambulance[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: ambulance[1][0],
    error: null,
  });
});

// DELETE - DELETE /ambulance/:id
export const ambulanceDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const hospital = await Ambulance.findByPk(id);
  if (!hospital) {
    res.status(404).json({
      success: false,
      message: "Hospital not found",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  await Ambulance.destroy({
    where: { id: id }
  });

  res.status(200).json({
    success: true,
    message: "Your account deleted successfully",
    status: 200,
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

  res.status(200).json({
    success: true,
    status: "Success",
    data: ambulances,
    error: null,
  });
});

// FORGET PASSWORD - POST /ambulance/forgot
export const forgetpassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const ambulance = await Ambulance.findOne({ where: { email } });
  if (!ambulance) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: 200,
    data: ambulance,
    error: null,
  });
});

// CHANGE PASSWORD - PUT /ambulance/changepassword
export const changepassword: any = asyncHandler(async (req: Request, res: Response) => {
  const { password, email } = req.body;

  const ambulances = await Ambulance.findOne({ where: { email } });
  if (!ambulances) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  ambulances.password = hashedPassword;

  await ambulances.save();

  res.status(200).json({
    success: true,
    status: 200,
    data: ambulances,
    error: null,
  });
});