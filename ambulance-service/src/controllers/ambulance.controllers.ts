import { Request, Response } from "express";
import bcrypt from "bcrypt";
import asyncHandler from "express-async-handler";
import Ambulance from "../models/ambulance.model";
import { publishEvent } from "../events/publisher";
import { generateToken } from "../services/jwt.service";

// REGISTER - POST /ambulance/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  const { serviceName, address, phone, vehicleType, email, password } = req.body;

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

  // Hash password if provided
  let hashedPassword: string;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const newAmbulance = await Ambulance.create({
    serviceName: serviceName,
    address: address,
    phone: phone,
    vehicleType: vehicleType,
    email: email,
    password: hashedPassword,
  });

  await publishEvent("ambulance_events", "AMBULANCE_REGISTERED", {
    ambulanceId: newAmbulance.id,
    phone: newAmbulance.phone,
  });

  // Remove password from response
  const { password: _, ...ambulanceData } = newAmbulance.toJSON();

  res.status(201).json({
    success: true,
    message: "Registration completed successfully",
    data: ambulanceData,
    error: null,
  });
});

// LOGIN - POST /ambulance/login
export const login: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await Ambulance.findOne({ where: { email: email } });
  if (!user) {
    res.status(401).json({
      success: false,
      message: "Ambulance not found! Please register",
      data: null,
      error: { code: "AMBULANCE_NOT_FOUND", details: null },
    });
    return;
  }

  const checkPassword = await bcrypt.compare(password, user.password || "");
  if (!checkPassword) {
    res.status(401).json({
      success: false,
      message: "Wrong password, Please try again",
      data: null,
      error: { code: "WRONG_PASSWORD", details: null },
    });
    return;
  }

  const token = generateToken({ id: user.id, name: user.serviceName });

  // Remove password from response
  const { password: _, ...safeUser } = user.toJSON();

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    status: 200,
    token, // Return token for API Gateway forwarding
    data: safeUser,
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

  // Remove password from response
  const { password: _, ...safeUser } = user.toJSON();

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

  const ambulances = await Ambulance.findByPk(id);
  if (!ambulances) {
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

  // Remove password from response
  const safeAmbulances = ambulances.map(ambulance => {
    const { password, ...safeAmbulance } = ambulance.toJSON();
    return safeAmbulance;
  });

  res.status(200).json({
    success: true,
    status: "Success",
    data: safeAmbulances,
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

  // Remove password from response
  const { password: _, ...safeAmbulances } = ambulances;

  res.status(200).json({
    success: true,
    status: 200,
    data: safeAmbulances,
    error: null,
  });
});