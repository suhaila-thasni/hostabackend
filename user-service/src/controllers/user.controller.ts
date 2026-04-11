import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
import Patient from "../models/patient.model";
import PatientVitals from "../models/patientVitals.model";

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
  const t = await Patient.sequelize!.transaction();

  try {
    // 1. Extract Patient Info
    const {
      firstName, middleName, lastName, bloodGroup, gender, maritalStatus,
      patientType, age, dob, company, mobileNumber, emergencyNumber,
      guardianName, addressLine1, addressLine2, country, city, state, pinCode,
      referredBy, department, referredOn, notes, email, profileImage
    } = req.body;

    // 2. Extract Vitals Info (if any)
    const {
      temperature, pulse, respiratoryRate, spo2, height, weight, waist
    } = req.body;

    // 3. Create Patient
    const patient = await Patient.create({
      firstName, middleName, lastName, bloodGroup, gender, maritalStatus,
      patientType, age, dob, company, mobileNumber, emergencyNumber,
      guardianName, addressLine1, addressLine2, country, city, state, pinCode,
      referredBy, department, referredOn, notes, email, profileImage
    }, { transaction: t });

    // 4. If any vitals field is provided, create a vitals record
    if (temperature || pulse || respiratoryRate || spo2 || height || weight || waist) {
      // We'll calculate BMI/BSA here or let the service handle it.
      // Since addVitals in patientVitalsService handles calculation, let's use a helper or just do it here to keep things in one transaction.
      
      let bmi, bsa;
      if (height && weight) {
        const hInM = height / 100;
        bmi = parseFloat((weight / (hInM * hInM)).toFixed(2));
        bsa = parseFloat((0.007184 * Math.pow(height, 0.725) * Math.pow(weight, 0.425)).toFixed(4));
      }

      await PatientVitals.create({
        patientId: patient.id,
        temperature, pulse, respiratoryRate, spo2,
        height, weight, waist, bmi, bsa
      }, { transaction: t });
    }

    await t.commit();

    // Fetch the stored patient with vitals to return
    const result = await Patient.findByPk(patient.id, {
      include: [{ model: PatientVitals, as: "vitals" }]
    });

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: result,
    });
  } catch (error: any) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message || "Failed to create patient" });
  }
});


// GET ALL PATIENTS
export const getPatients: any = asyncHandler(async (req: Request, res: Response) => {
  const patients = await Patient.findAll({
    include: [{ model: PatientVitals, as: "vitals", limit: 1, order: [["createdAt", "DESC"]] }],
  });

  res.status(200).json({
    success: true,
    data: patients,
  });
});

// GET ONE PATIENT (with all vitals history)
export const getPatient: any = asyncHandler(async (req: Request, res: Response) => {
  const patient = await Patient.findByPk(req.params.id, {
    include: [{ model: PatientVitals, as: "vitals", order: [["createdAt", "DESC"]] }],
  });

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
