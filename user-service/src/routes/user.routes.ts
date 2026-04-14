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
  updatePatient,
  deletePatient,
} from "../controllers/user.controller";

import {
  createPrescription,
  getPrescription,
  getAPrescription,
  deletePrescription,
  updateData
} from "../controllers/prescription.controller";


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
router.get("/users", authenticate, getUsers);
router.get("/users/:id", authenticate, validateParams(idParamSchema), getUser);
router.delete("/users/:id", authenticate, validateParams(idParamSchema), deleteUser);



router.post("/users/:id/token", validateParams(idParamSchema), saveExpoToken);
router.post("/users/test/:id", validateParams(idParamSchema), testPushNotification);


// Patient Routes
router.post("/patients", authenticate, createPatient);
router.get("/patients", authenticate, getPatients);
router.get("/patients/:id", authenticate, validateParams(idParamSchema), getPatient);
router.put("/patients/:id", authenticate, validateParams(idParamSchema), updatePatient);
router.delete("/patients/:id", authenticate, validateParams(idParamSchema), deletePatient);



// Prescription

router.post("/prescription", authenticate, createPrescription);
router.get("/prescription", authenticate, getPrescription);
router.get("/prescription/:id", authenticate, getAPrescription);
router.put("/prescription/:id", authenticate, updateData);
router.delete("/prescription/:id", authenticate, deletePrescription);


export default router;



