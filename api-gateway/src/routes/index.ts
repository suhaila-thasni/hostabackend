import express from "express";
import ambulanceRoutes from "./ambulance.routes";

const router = express.Router();

router.use("/", ambulanceRoutes);

export default router;
