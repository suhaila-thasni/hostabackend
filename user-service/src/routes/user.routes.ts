import { Router } from "express";
import {
  registerUser,
  loginUser,
  loginWithPhone,
  verifyOtp,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  resetPassword,
  sendOtpEmail,
  verifyOtpEmail,
  resetPasswordEmail,
  changePassword,
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
import { registerSchema, loginSchema, idParamSchema, loginWithPhoneSchema, verifyOtpSchema, updateUserSchema, sendOtpEmailSchema, verifyOtpEmailSchema, resetPasswordEmailSchema, changePasswordSchema } from "../validators/user.validator";
import { authenticate, restrictTo } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();                              

// User Routes
router.post("/users/register", validate(registerSchema), registerUser);
router.post("/users/login", validate(loginSchema), loginUser);
router.post("/users/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/users/otp", validate(verifyOtpSchema), verifyOtp);
// router.post("/users/password", resetPassword);

// Email Password Reset Flow
router.post("/users/auth/send-otp", validate(sendOtpEmailSchema), sendOtpEmail);
router.post("/users/auth/verify-otp", validate(verifyOtpEmailSchema), verifyOtpEmail);
router.post("/users/auth/reset-password", validate(resetPasswordEmailSchema), resetPasswordEmail);
router.put("/users/auth/change-password", authenticate, validate(changePasswordSchema), changePassword);

router.get("/users", authenticate, getUsers);
router.get("/users/:id", authenticate, validateParams(idParamSchema), getUser);
router.put("/users/:id", authenticate, validateParams(idParamSchema), validate(updateUserSchema), updateUser);
router.delete("/users/:id", authenticate, validateParams(idParamSchema), deleteUser);


// router.post("/users/:id/token", validateParams(idParamSchema), saveExpoToken);
// router.post("/users/test/:id", validateParams(idParamSchema), testPushNotification);


// Patient Routes
router.post("/patients", authenticate,checkPermission("patient", "create"), createPatient);
router.get("/patients", authenticate, checkPermission("patient", "view")  , getPatients);
router.get("/patients/:id", authenticate, checkPermission("patient", "view"), validateParams(idParamSchema), getPatient);
router.put("/patients/:id", authenticate, checkPermission("patient", "edit"), validateParams(idParamSchema), updatePatient);
router.delete("/patients/:id", authenticate, checkPermission("patient", "delete"), validateParams(idParamSchema), deletePatient);



// Prescription

router.post("/prescription", authenticate, checkPermission("prescription", "create"), createPrescription);
router.get("/prescription", authenticate, checkPermission("prescription", "view"), getPrescription);
router.get("/prescription/:id", authenticate, checkPermission("prescription", "view"), getAPrescription);
router.put("/prescription/:id", authenticate, checkPermission("prescription", "edit"), updateData);
router.delete("/prescription/:id", authenticate, checkPermission("prescription", "delete"), deletePrescription);


export default router;








