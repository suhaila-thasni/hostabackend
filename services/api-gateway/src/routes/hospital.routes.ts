import express from "express";
import { proxyRequest } from "../services/hospital.service";

const router = express.Router();

router.use("/hospital", proxyRequest);
router.use("/prescription-template", proxyRequest);
router.use("/attendances", proxyRequest); // Added for attendance API
router.use("/devices", proxyRequest);

export default router;
