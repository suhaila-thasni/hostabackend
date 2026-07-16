import { Router } from 'express';
import {
  login,
  loginWithPhone,
  verifyLoginOtp,
  sendOtp,
  verifyOtp,
  resetPassword,
  changePassword,
  refreshHospitalToken,
  logout,
  register,
  deleteAuth,
  update,
  getAuthByid
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  loginHospitalSchema,
  loginWithPhoneSchema,
  verifyOtpSchema,
  loginWithEmailSchema,
  resetPasswordSchema,
  changePasswordSchema,
  registerSchema,
  updateSchema
} from '../validators/auth.validator';

const router = Router();

// Auth & Password Flow
router.post("/login", validate(loginHospitalSchema), login);
router.post("/login/phone", validate(loginWithPhoneSchema), loginWithPhone);
router.post("/otp", validate(verifyOtpSchema), verifyLoginOtp);
router.post("/", validate(registerSchema), register);
router.put("/:id/role/:roles", authenticate, validate(updateSchema), update);
router.delete("/:id/role/:roles", deleteAuth);
router.get("/:id/role/:roles",  getAuthByid);




// Production Auth Routes
router.post("/send-otp", validate(loginWithEmailSchema), sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

router.put("/change-password", authenticate, validate(changePasswordSchema), changePassword);
router.post("/refresh", refreshHospitalToken);
router.post("/logout/:id", authenticate, logout);

export default router;
