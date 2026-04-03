import { Request, Response } from "express";
import bcrypt from "bcrypt";
import asyncHandler from "express-async-handler";
import User from "../models/user.model";
import Patient from "../models/patient.model";
import { generateToken } from "../services/jwt.service";

// --- USER CONTROLLERS ---

// REGISTER
export const registerUser: any = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = req.body;

  const exist = await User.findOne({ where: { email } });
  if (exist) {
    res.status(400).json({
      success: false,
      message: "User already exists",
      error: { code: "USER_EXISTS" },
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
  });

  const { password: _, ...safeUser } = user.toJSON();

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: safeUser,
  });
});

// LOGIN
export const loginUser: any = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  const match = await bcrypt.compare(password, user.password || "");
  if (!match) {
    res.status(401).json({
      success: false,
      message: "Wrong password",
    });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email });

  const { password: _, ...safeUser } = user.toJSON();

  res.status(200).json({
    success: true,
    message: "Login success",
    token,
    data: safeUser,
  });
});

// GET ALL USERS
export const getUsers: any = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.findAll();

  res.status(200).json({
    success: true,
    data: users,
  });
});

// GET ONE USER
export const getUser: any = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// DELETE USER
export const deleteUser: any = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  await User.destroy({ where: { id: req.params.id } });

  res.status(200).json({
    success: true,
    message: "User deleted",
  });
});


// --- PATIENT CONTROLLERS ---

// CREATE PATIENT
export const createPatient: any = asyncHandler(async (req: Request, res: Response) => {
  const patient = await Patient.create(req.body);

  res.status(201).json({
    success: true,
    message: "Patient created successfully",
    data: patient,
  });
});

// GET ALL PATIENTS
export const getPatients: any = asyncHandler(async (req: Request, res: Response) => {
  const patients = await Patient.findAll();

  res.status(200).json({
    success: true,
    data: patients,
  });
});

// GET ONE PATIENT
export const getPatient: any = asyncHandler(async (req: Request, res: Response) => {
  const patient = await Patient.findByPk(req.params.id);

  if (!patient) {
    res.status(404).json({
      success: false,
      message: "Patient not found",
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: patient,
  });
});
