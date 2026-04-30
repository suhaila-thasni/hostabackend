import { Router } from "express";
import {
  checkPermissionService,
  createPermission,
  getPermission,
  getanPermission,
  permissionDelete,
  updateData
} from "../controllers/permission.controllers";

const router = Router();

// CRUD Operations
router.post("/", createPermission);
router.get("/", getPermission);
router.get("/:id", getanPermission);
router.put("/:id", updateData);
router.delete("/:id", permissionDelete);

// Permission Check (Internal usage)
router.post("/check", checkPermissionService);

export default router;