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
} from "../controllers/staff.controllers";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  registerStaffSchema,
  loginStaffSchema,
  loginWithPhoneSchema,
  verifyOtpSchema,
  idParamSchema,
  updateStaffSchema
} from "../validators/staff.validator";

const router = Router();

// Auth
router.post("/staff/register", validate(registerStaffSchema), Registeration);
router.post("/staff/login", validate(loginStaffSchema), login);
router.post("/staff/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/staff/otp", validate(verifyOtpSchema), verifyOtp);
router.post("/staff/password", changepassword);

// CRUD
router.get("/staff", getStaffs);
router.get("/staff/:id", validateParams(idParamSchema), getanStaff);
router.put("/staff/:id", validateParams(idParamSchema), validate(updateStaffSchema), updateData);
router.delete("/staff/:id", validateParams(idParamSchema), staffDelete);

export default router;