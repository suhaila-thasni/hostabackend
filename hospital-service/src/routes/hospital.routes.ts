import { Router } from "express";
import {
  Registeration,
  login,
  loginWithPhone,
  verifyOtp,
  getanHospital,
  updateData,
  hospitalDelete,
  getHospital,
  changepassword,
} from "../controllers/hospital.controllers";
import { validate } from "../middleware/validate.middleware";
import { 
  registerHospitalSchema, 
  loginHospitalSchema, 
  loginWithPhoneSchema, 
  verifyOtpSchema, 
  changePasswordSchema 
} from "../validators/hospital.validator";

const router = Router();

// Auth
router.post("/hospital/register", validate(registerHospitalSchema), Registeration);
router.post("/hospital/login", validate(loginHospitalSchema), login);
router.post("/hospital/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/hospital/otp", validate(verifyOtpSchema), verifyOtp);
router.put("/hospital/password", validate(changePasswordSchema), changepassword);

// CRUD

router.get("/hospital", getHospital);
router.get("/hospital/:id", getanHospital);
router.put("/hospital/:id", updateData);
router.delete("/hospital/:id", hospitalDelete);

export default router;