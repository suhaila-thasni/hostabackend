import express from "express";
import { sendEmailNotification } from "../controllers/email.controller";
import { authenticate } from "../middleware/authenticate";

const router = express.Router();

router.post("/send-email", authenticate, sendEmailNotification);

export default router;