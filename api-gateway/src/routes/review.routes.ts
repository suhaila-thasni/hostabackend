import express from "express";
import { proxyRequest } from "../services/medicinereminder.service";

const router = express.Router();

// Forward all /review traffic to the review microservice
router.use("/review", proxyRequest);

export default router;  