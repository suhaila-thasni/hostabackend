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
router.post("/stocks", authenticate,checkPermission("bloodbank", "create"), createOrUpdateStock);
router.get("/stocks", authenticate,checkPermission("bloodbank", "view"), getAllStock);
router.get("/stocks/hospital/:hospitalId", authenticate,checkPermission("bloodbank", "view"), getStocksByHospitalId);
router.get("/stocks/:id", authenticate,checkPermission("bloodbank", "view"), getStockById);
router.put("/stocks/:id", authenticate,checkPermission("bloodbank", "edit"), updateStockById);
router.delete("/stocks/:id", authenticate,checkPermission("bloodbank", "delete"), deleteStockById);

export default router;
