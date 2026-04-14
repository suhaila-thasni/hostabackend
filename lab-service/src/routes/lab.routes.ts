import { Router } from "express";
import {
  Registeration,
  login,
  getanLab,
  updateData,
  labDelete,
  getLab,
  forgetpassword,
  changepassword,
} from "../controllers/lab.controllers";

const router = Router();

// Auth
router.post("/lab/register", Registeration);
router.post("/lab/login", login);
router.post("/lab/forgot", forgetpassword);
router.put("/lab/changepassword", changepassword);

// CRUD

router.get("/lab", getLab);
router.get("/lab/:id", getanLab);
router.put("/lab/:id", updateData);
router.delete("/lab/:id", labDelete);

export default router;