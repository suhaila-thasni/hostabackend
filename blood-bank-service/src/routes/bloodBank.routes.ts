import { Router } from "express";
import {
  createOrUpdateStock,
  getAllStock,
  getStockById,
  getStocksByHospitalId,
  updateStockById,
  deleteStockById,
} from "../controllers/bloodBank.controller";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

// CRUD — all routes require authentication
router.post("/blood-banks", authenticate, checkPermission("blood_bank", "create"), createOrUpdateStock);
router.get("/blood-banks", authenticate,  checkPermission("blood_bank", "create"), getAllStock);
router.get("/blood-banks/hospital/:hospitalId",  checkPermission("blood_bank", "create"), authenticate, getStocksByHospitalId);
router.get("/blood-banks/:id", authenticate,  checkPermission("blood_bank", "create"), getStockById);
router.put("/blood-banks/:id", authenticate,  checkPermission("blood_bank", "create"), updateStockById);
router.delete("/blood-banks/:id", authenticate,  checkPermission("blood_bank", "create"), deleteStockById);

export default router;
