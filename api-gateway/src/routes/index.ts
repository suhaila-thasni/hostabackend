import express from "express";
import ambulanceRoutes from "./ambulance.routes";
import userRoutes from "./user.routes";

import bloodRoutes from "./blood.routes";

const router = express.Router();

router.use("/", bloodRoutes);
router.use("/", ambulanceRoutes);
router.use("/", userRoutes);

export default router;
