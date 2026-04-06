import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
import Patient from "../models/patient.model";

// --- USER CONTROLLERS ---

export const registerUser: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = await userService.register(req.body);
    res.status(201).json({ success: true, message: "User registered successfully", data });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});

export const loginUser: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token, user } = await userService.login(req.body);
    res.status(200).json({ success: true, message: "Login success", token, data: user });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server Error" });
  }
});

export const loginWithPhone: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await userService.loginWithPhone(req.body.phone || "");
    res.status(200).json({ ...result, success: true, status: 200 });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Failed to send OTP" });
  }
});

export const verifyOtp: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { token, user } = await userService.verifyOtp(req.body);
    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      userDetails: user,
      status: 200,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server error" });
  }
});

export const getUsers: any = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  res.status(200).json({ success: true, data: users });
});

export const getUser: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export const deleteUser: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export const resetPassword: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    await userService.resetPassword(req.body);
    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export const saveExpoToken: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = await userService.saveExpoToken(req.params.id, req.body.expoPushToken);
    res.status(200).json({ success: true, message: "Expo token updated", user });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export const testPushNotification: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await userService.testPushNotification(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});


// --- PATIENT CONTROLLERS ---

// CREATE PATIENT
export const createPatient: any = asyncHandler(async (req: Request, res: Response) => {
  // Only extract allowed fields for production security (Prevent Mass Assignment)
  const { name, age, gender, address, phone, emergencyContact, medicalCondition } = req.body;
  
  const patient = await Patient.create({
    name, age, gender, address, phone, emergencyContact, medicalCondition
  } as any);

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
