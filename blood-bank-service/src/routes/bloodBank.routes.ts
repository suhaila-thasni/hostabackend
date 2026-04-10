import { Router } from "express";
import { createOrUpdateStock, getAllStock, getStockById, updateStockById, deleteStockById } from "../controllers/bloodBank.controller";

const router = Router();

router.post("/stocks", createOrUpdateStock);
router.get("/stocks", getAllStock);
router.get("/stocks/:id", getStockById);
router.put("/stocks/:id", updateStockById);
router.delete("/stocks/:id", deleteStockById);

export default router;
