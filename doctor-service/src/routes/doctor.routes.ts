import { Router } from "express";
import {
  Registeration,
  login,
  loginWithPhone,
  verifyOtp,
  getanDoctor,
  updateData,
  doctorDelete,
  getDoctors,
  changepassword,
} from "../controllers/doctor.controllers";
import { validate } from "../middleware/validate.middleware";
import { 
  registerDoctorSchema, 
  loginDoctorSchema, 
  loginWithPhoneSchema, 
  verifyOtpSchema, 
  changePasswordSchema 
} from "../validators/doctor.validator";

const router = Router();

// Auth
router.post("/doctor/register", validate(registerDoctorSchema), Registeration);
router.post("/doctor/login", validate(loginDoctorSchema), login);
router.post("/doctor/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/doctor/otp", validate(verifyOtpSchema), verifyOtp);
router.put("/doctor/password", validate(changePasswordSchema), changepassword);

// CRUD

router.get("/doctor", getDoctors);
router.get("/doctor/:id", getanDoctor);
router.put("/doctor/:id", updateData);
router.delete("/doctor/:id", doctorDelete);

export default router;