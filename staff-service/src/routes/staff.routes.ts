import { Router } from "express";
import {
  Registeration,
  login,
  getanStaff,
  updateData,
  staffDelete,
  getStaffs,
  forgetpassword,
  changepassword,
} from "../controllers/staff.controllers";

const router = Router();

// Auth
router.post("/staff/register", Registeration);
router.post("/staff/login", login);
router.post("/staff/forgot", forgetpassword);
router.put("/staff/changepassword", changepassword);

// CRUD

router.get("/staff", getStaffs);
router.get("/staff/:id", getanStaff);
router.put("/staff/:id", updateData);
router.delete("/staff/:id", staffDelete);

export default router;