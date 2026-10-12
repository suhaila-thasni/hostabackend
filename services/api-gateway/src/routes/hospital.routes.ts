import express from "express";
import { proxyRequest } from "../services/hospital.service";

const router = express.Router();

router.use("/hospital", proxyRequest);
router.use("/prescription-template", proxyRequest);
router.use("/attendances", proxyRequest); // Added for attendance API
router.use("/holidays", proxyRequest); // Proxy for holidays
router.use("/devices", proxyRequest);
router.use("/fingerprint-enrollments", proxyRequest);
router.use("/rfid-card-assignments", proxyRequest);
router.use("/leave-requests", proxyRequest);
router.use("/leave-templates", proxyRequest);

export default router;
