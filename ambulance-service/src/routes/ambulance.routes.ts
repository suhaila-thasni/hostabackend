import { Router } from "express";
import {
  Registeration,
  login,
  getanAmbulace,
  updateData,
  ambulanceDelete,
  getAmbulaces,
  forgetpassword,
  changepassword,
} from "../controllers/ambulance.controllers";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  updateSchema,
  changePasswordSchema,
  forgetPasswordSchema,
  idParamSchema,
} from "../validators/ambulance.validator";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Auth
router.post("/ambulance/register", validate(registerSchema), Registeration);
router.post("/ambulance/login", validate(loginSchema), login);
router.post("/ambulance/forgot", validate(forgetPasswordSchema), forgetpassword);
router.put("/ambulance/changepassword", authenticate, validate(changePasswordSchema), changepassword);

// CRUD
router.get("/ambulance", authenticate, getAmbulaces);
router.get("/ambulance/:id", authenticate, validateParams(idParamSchema), getanAmbulace);
router.put("/ambulance/:id", authenticate, validateParams(idParamSchema), validate(updateSchema), updateData);
router.delete("/ambulance/:id", authenticate, validateParams(idParamSchema), ambulanceDelete);

export default router;