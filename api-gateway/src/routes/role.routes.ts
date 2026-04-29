import express from "express";
import { proxyRequest } from "../services/role.service";

const router = express.Router();

router.use("/role", proxyRequest);

export default router;
