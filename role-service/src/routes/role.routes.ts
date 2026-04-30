import { Router } from "express";
import {
  createRole,
  getRole,
  getanRole,
  roleDelete,
  updateData
} from "../controllers/role.controllers";

const router = Router();

// CRUD Operations
router.post("/", createRole);
router.get("/", getRole);
router.get("/:id", getanRole);
router.put("/:id", updateData);
router.delete("/:id", roleDelete);

export default router;