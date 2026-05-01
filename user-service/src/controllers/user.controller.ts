import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { userService } from "../services/user.service";
import Patient from "../models/patient.model";
import PatientVitals from "../models/patientVitals.model";
import User from "../models/user.model";

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

export const updateUser: any = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({ success: true, message: "User updated successfully", data: user });
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

export const sendOtpEmail: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await userService.sendOtpByEmail(req.body.email);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export const verifyOtpEmail: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await userService.verifyOtpEmail(req.body);
    res.status(200).json({ success: true, message: "OTP verified", ...result });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export const resetPasswordEmail: any = asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await userService.resetPasswordWithEmail(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

export const changePassword: any = asyncHandler(async (req: any, res: Response) => {
  try {
    const result = await userService.changePassword(req.user.id, req.body);
    res.status(200).json(result);
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
      referredBy, department, referredOn, notes, email, profileImage, userId
    } = req.body;

    // 2. Extract Vitals Info (if any)
    const {
      temperature, pulse, respiratoryRate, spo2, height, weight, waist
    } = req.body;

    // 3. Validate userId (if provided)
    if (userId) {
      const userExists = await User.findByPk(userId);
      if (!userExists) {
        res.status(400).json({ success: false, message: `User with ID ${userId} does not exist.` });
        return;
      }
    }

    // 4. Create Patient
    const patient = await Patient.create({
      firstName, middleName, lastName, bloodGroup, gender, maritalStatus,
      patientType, age, dob, company, mobileNumber, emergencyNumber,
      guardianName, addressLine1, addressLine2, country, city, state, pinCode,
      referredBy, department, referredOn, notes, email, profileImage, userId
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

    // Fetch the stored patient with vitals + user to return
    const result = await Patient.findByPk(patient.id, {
      include: [
        { model: PatientVitals, as: "vitals" },
        { model: User, as: "user", attributes: ["id", "name", "email", "phone"] },
      ],
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
    include: [
      { model: PatientVitals, as: "vitals", limit: 1, order: [["createdAt", "DESC"]] },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] },
    ],
  });

  res.status(200).json({
    success: true,
    data: patients,
  });
});

// GET ONE PATIENT (with all vitals history)
export const getPatient: any = asyncHandler(async (req: Request, res: Response) => {
  const patient = await Patient.findByPk(req.params.id, {
    include: [
      { model: PatientVitals, as: "vitals", order: [["createdAt", "DESC"]] },
      { model: User, as: "user", attributes: ["id", "name", "email", "phone"] },
    ],
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

// UPDATE PATIENT (Allows updating profile + recording new vitals)
export const updatePatient: any = asyncHandler(async (req: Request, res: Response) => {
  const t = await Patient.sequelize!.transaction();
  
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      res.status(404).json({ success: false, message: "Patient not found" });
      return;
    }

    // 1. Update Patient Profile Fields
    const {
      firstName, middleName, lastName, bloodGroup, gender, maritalStatus,
      patientType, age, dob, company, mobileNumber, emergencyNumber,
      guardianName, addressLine1, addressLine2, country, city, state, pinCode,
      referredBy, department, referredOn, notes, email, profileImage, userId
    } = req.body;

    // 1.5 Validate userId (if provided)
    if (userId) {
      const userExists = await User.findByPk(userId);
      if (!userExists) {
        res.status(400).json({ success: false, message: `User with ID ${userId} does not exist.` });
        return;
      }
    }

    await patient.update({
      firstName, middleName, lastName, bloodGroup, gender, maritalStatus,
      patientType, age, dob, company, mobileNumber, emergencyNumber,
      guardianName, addressLine1, addressLine2, country, city, state, pinCode,
      referredBy, department, referredOn, notes, email, profileImage, userId
    }, { transaction: t });

    // 2. Check for NEW Vitals in the same request
    const {
      temperature, pulse, respiratoryRate, spo2, height, weight, waist
    } = req.body;

    if (temperature || pulse || respiratoryRate || spo2 || height || weight || waist) {
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

    // 3. Return updated patient with fresh vitals + user
    const result = await Patient.findByPk(patient.id, {
      include: [
        { model: PatientVitals, as: "vitals", limit: 1, order: [["createdAt", "DESC"]] },
        { model: User, as: "user", attributes: ["id", "name", "email", "phone"] },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Patient record updated successfully",
      data: result,
    });
  } catch (error: any) {
    await t.rollback();
    res.status(500).json({ success: false, message: error.message || "Failed to update patient" });
  }
});


// DELETE PATIENT
export const deletePatient: any = asyncHandler(async (req: Request, res: Response) => {
  const patient = await Patient.findByPk(req.params.id);

  if (!patient) {
    res.status(404).json({ success: false, message: "Patient not found" });
    return;
  }

  await patient.destroy(); // Soft delete because of paranoid: true

  res.status(200).json({
    success: true,
    message: "Patient deleted successfully",
  });
});

