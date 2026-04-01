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

const router = Router();

// Auth
router.post("/ambulance/register", validate(registerSchema), Registeration);
router.post("/ambulance/login", validate(loginSchema), login);
router.post("/ambulance/forgot", validate(forgetPasswordSchema), forgetpassword);
router.put("/ambulance/changepassword", validate(changePasswordSchema), changepassword);

// CRUD
router.get("/ambulance", getAmbulaces);
router.get("/ambulance/:id", validateParams(idParamSchema), getanAmbulace);
router.put("/ambulance/:id", validateParams(idParamSchema), validate(updateSchema), updateData);
router.delete("/ambulance/:id", validateParams(idParamSchema), ambulanceDelete);

export default router;