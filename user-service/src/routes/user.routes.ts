import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  deleteUser,
  createPatient,
  getPatients,
  getPatient,
} from "../controllers/user.controller";

import { validate, validateParams } from "../middleware/validate.middleware";
import { registerSchema, loginSchema, idParamSchema } from "../validators/user.validator";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// User Routes
router.post("/users/register", validate(registerSchema), registerUser);
router.post("/users/login", validate(loginSchema), loginUser);
router.get("/users", authenticate, getUsers);
router.get("/users/:id", authenticate, validateParams(idParamSchema), getUser);
router.delete("/users/:id", authenticate, validateParams(idParamSchema), deleteUser);

// Patient Routes
router.post("/patients", authenticate, createPatient);
router.get("/patients", authenticate, getPatients);
router.get("/patients/:id", authenticate, validateParams(idParamSchema), getPatient);

export default router;
