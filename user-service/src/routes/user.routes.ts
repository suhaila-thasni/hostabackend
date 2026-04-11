import { Router } from "express";
import {
  registerUser,
  loginUser,
  loginWithPhone,
  verifyOtp,
  getUsers,
  getUser,
  deleteUser,
  resetPassword,
  saveExpoToken,
  testPushNotification,
  createPatient,
  getPatients,
  getPatient,
} from "../controllers/user.controller";

import {
  addVitals,
  getVitalsByPatient,
  getLatestVitals,
  getVitalsById,
  updateVitals,
  deleteVitals,
} from "../controllers/patientVitals.controller";

import { validate, validateParams } from "../middleware/validate.middleware";
import { registerSchema, loginSchema, idParamSchema, loginWithPhoneSchema, verifyOtpSchema } from "../validators/user.validator";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// User Routes
router.post("/users/register", validate(registerSchema), registerUser);
router.post("/users/login", validate(loginSchema), loginUser);
router.post("/users/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/users/otp", validate(verifyOtpSchema), verifyOtp);
router.post("/users/password", resetPassword);
router.post("/users/:id/token", validateParams(idParamSchema), saveExpoToken);
router.post("/users/test/:id", validateParams(idParamSchema), testPushNotification);
router.get("/users", authenticate, getUsers);
router.get("/users/:id", authenticate, validateParams(idParamSchema), getUser);
router.delete("/users/:id", authenticate, validateParams(idParamSchema), deleteUser);

// Patient Routes
router.post("/patients", authenticate, createPatient);
router.get("/patients", authenticate, getPatients);
router.get("/patients/:id", authenticate, validateParams(idParamSchema), getPatient);

// Patient Vitals Routes
router.post("/patients/:patientId/vitals", authenticate, addVitals);
router.get("/patients/:patientId/vitals", authenticate, getVitalsByPatient);
router.get("/patients/:patientId/vitals/latest", authenticate, getLatestVitals);
router.get("/vitals/:id", authenticate, getVitalsById);
router.put("/vitals/:id", authenticate, updateVitals);
router.delete("/vitals/:id", authenticate, deleteVitals);

export default router;
