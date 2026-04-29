import { Router } from "express";
import {
  Registeration,
  login,
  loginWithPhone,
  verifyOtp,
  verifyLoginOtp,
  sendOtp,
  resetPassword,
  changePassword,
  getanLab,
  updateData,
  labDelete,
  getLabs,
} from "../controllers/lab.controllers";


import { validate, validateParams } from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  loginWithPhoneSchema,
  loginWithEmailSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateSchema,
  idParamSchema,
} from "../validators/lab.validator";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";


const router = Router();

// Auth & Password Flow
router.post("/lab/register", validate(registerSchema), Registeration);
router.post("/lab/login", validate(loginSchema), login);
router.post("/lab/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/lab/otp", validate(verifyOtpSchema), verifyLoginOtp);

// Production Auth Routes
router.post("/lab/auth/send-otp", validate(loginWithEmailSchema), sendOtp);
router.post("/lab/auth/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/lab/auth/reset-password", validate(resetPasswordSchema), resetPassword);
router.put("/lab/auth/change-password", authenticate, validate(changePasswordSchema), changePassword);

// CRUD
router.get("/lab", authenticate, checkPermission("lab", "view"), getLabs);
router.get("/lab/:id", validateParams(idParamSchema), checkPermission("lab", "view"), getanLab);
router.put("/lab/:id", validateParams(idParamSchema), validate(updateSchema), checkPermission("lab", "edit"), updateData);
router.delete("/lab/:id", authenticate, validateParams(idParamSchema), checkPermission("lab", "delete"), labDelete);


export default router;