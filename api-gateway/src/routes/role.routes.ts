import express from "express";
import { proxyRequest } from "../services/role.service";

const router = express.Router();

router.use("/roles", proxyRequest);

export default router;
