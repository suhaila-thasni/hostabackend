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

const router = Router();

// Auth
router.post("/ambulance/register", Registeration);
router.post("/ambulance/login", login);
router.post("/ambulance/forgot", forgetpassword);
router.put("/ambulance/changepassword", changepassword);

// CRUD
router.get("/ambulance", getAmbulaces);
router.get("/ambulance/:id", getanAmbulace);
router.put("/ambulance/:id", updateData);
router.delete("/ambulance/:id", ambulanceDelete);

export default router;