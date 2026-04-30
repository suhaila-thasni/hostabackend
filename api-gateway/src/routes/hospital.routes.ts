import express from "express";
import { proxyRequest } from "../services/hospital.service";

const router = express.Router();

router.use("/hospitals", proxyRequest);

export default router;
