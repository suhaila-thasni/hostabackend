import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { 
  registerHospitalSchema, 
  loginHospitalSchema, 
  loginWithPhoneSchema, 
  verifyOtpSchema, 
  changePasswordSchema,
  loginWithEmailSchema,
  resetPasswordSchema,
  sendCustomEmailSchema 
} from "../validators/hospital.validator";
import { 
  Registeration,
  login,
  loginWithPhone,
  sendOtp,
  verifyOtp,
  verifyLoginOtp,
  resetPassword,
  changePassword,
  sendCustomEmail,
  getanHospital,
  getHospital,
  updateData,
  hospitalDelete 
} from "../controllers/hospital.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

/**
 * @route   POST /api/v1/hospitals/register
 * @desc    Register a new hospital
 * @access  Public
 */
router.post("/register", validate(registerHospitalSchema), Registeration);

/**
 * @route   POST /api/v1/hospitals/login
 * @desc    Login via email/password
 * @access  Public
 */
router.post("/login", validate(loginHospitalSchema), login);

/**
 * @route   POST /api/v1/hospitals/login/phone
 * @desc    Login via phone
 * @access  Public
 */
router.post("/login/phone", validate(loginWithPhoneSchema), loginWithPhone);

/**
 * @route   POST /api/v1/hospitals/otp
 * @desc    Verify login OTP
 * @access  Public
 */
router.post("/otp", validate(verifyOtpSchema), verifyLoginOtp);

// --- Auth & Password Flow ---
router.post("/auth/send-otp", validate(loginWithEmailSchema), sendOtp);
router.post("/auth/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/auth/reset-password", validate(resetPasswordSchema), resetPassword);
router.put("/auth/change-password", authenticate, validate(changePasswordSchema), changePassword);

// --- Notifications ---
router.post("/notify/email", authenticate, validate(sendCustomEmailSchema), sendCustomEmail);

// --- CRUD Operations ---
router.get("/", authenticate, checkPermission("hospital", "view"), getHospital);
router.get("/:id", authenticate, checkPermission("hospital", "view"), getanHospital);
router.put("/:id", authenticate, checkPermission("hospital", "edit"), updateData);
router.delete("/:id", authenticate, checkPermission("hospital", "delete"), hospitalDelete);

export default router;



