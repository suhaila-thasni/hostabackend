import express from "express";
import { proxyRequest } from "../services/blood.service";

const router = express.Router();

router.use("/blood", proxyRequest);

export default router;
