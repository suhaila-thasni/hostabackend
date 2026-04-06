import { Router } from "express";
import { createOrUpdateStock, getAllStock, updateStockByGroup, deleteStock } from "../controllers/bloodBank.controller";

const router = Router();

router.post("/stocks", createOrUpdateStock);
router.get("/stocks", getAllStock);
router.put("/stocks/:group", updateStockByGroup);
router.delete("/stocks/:group", deleteStock);

export default router;
