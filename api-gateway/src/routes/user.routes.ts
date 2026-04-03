import express from "express";
import { proxyRequest } from "../services/user.service";

const router = express.Router();

// Proxy all requests starting with /users or /patients to the user-service
router.use("/users", proxyRequest);
router.use("/patients", proxyRequest);

export default router;
