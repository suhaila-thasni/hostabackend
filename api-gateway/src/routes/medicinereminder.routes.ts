import express from "express";
import { proxyRequest } from "../services/medicinereminder.service";

const router = express.Router();

// Forward all /medicine-reminder traffic to the medicine reminder microservice
router.use("/medicine-reminder", proxyRequest);

export default router;  