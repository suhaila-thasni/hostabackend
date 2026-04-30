import { Router } from "express";
import {
  Registeration,
  login,
  loginWithPhone,
  verifyOtp,
  getanStaff,
  updateData,
  staffDelete,
  getStaffs,
  changepassword,
  sendStaffOtp,
  verifyStaffOtp,
  resetStaffPassword,
  changeStaffPassword,
} from "../controllers/staff.controllers";

import { validate, validateParams } from "../middleware/validate.middleware";
import {
  registerStaffSchema,
  loginStaffSchema,
  loginWithPhoneSchema,
  loginWithEmailSchema,
  verifyOtpSchema,
  idParamSchema,
  updateStaffSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/staff.validator";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";



const router = Router();

// Auth

router.post("/staff", validate(registerStaffSchema),checkPermission("staff", "create"), Registeration);
router.post("/staff/login", validate(loginStaffSchema), login);
router.post("/staff/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/staff/otp", validate(verifyOtpSchema), verifyOtp);
// router.post("/staff/password", changepassword);




router.post("/staff/auth/send-otp", validate(loginWithEmailSchema), sendStaffOtp);

router.post("/staff/auth/verify-otp", validate(verifyOtpSchema), verifyStaffOtp);

router.post("/staff/auth/reset-password", validate(resetPasswordSchema), resetStaffPassword);

router.put("/staff/auth/change-password",authenticate, validate(changePasswordSchema),checkPermission("staff", "edit"),changeStaffPassword);





// CRUD
router.get("/staff",authenticate,checkPermission("staff", "view"), getStaffs);
router.get("/staff/:id",authenticate, validateParams(idParamSchema), checkPermission("staff", "view"),getanStaff);
router.put("/staff/:id",authenticate, validateParams(idParamSchema), validate(updateStaffSchema), checkPermission("staff", "edit"), updateData);
router.delete("/staff/:id",authenticate, validateParams(idParamSchema), checkPermission("staff", "delete"), staffDelete);

export default router;