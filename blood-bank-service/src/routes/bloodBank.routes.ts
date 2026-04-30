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

const router = Router();

// CRUD — all routes require authentication
router.post("/stocks", authenticate, createOrUpdateStock);
router.get("/stocks", authenticate, getAllStock);
router.get("/stocks/hospital/:hospitalId", authenticate, getStocksByHospitalId);
router.get("/stocks/:id", authenticate, getStockById);
router.put("/stocks/:id", authenticate, updateStockById);
router.delete("/stocks/:id", authenticate, deleteStockById);

export default router;
