import { Router } from "express";
import {
  Registeration,
  login,
  getanHospital,
  updateData,
  hospitalDelete,
  getHospital,
  forgetpassword,
  changepassword,
} from "../controllers/hospital.controllers";

const router = Router();

// Auth
router.post("/hospital/register", Registeration);
router.post("/hospital/login", login);
router.post("/hospital/forgot", forgetpassword);
router.put("/hospital/changepassword", changepassword);

// CRUD

router.get("/hospital", getHospital);
router.get("/hospital/:id", getanHospital);
router.put("/hospital/:id", updateData);
router.delete("/hospital/:id", hospitalDelete);

export default router;