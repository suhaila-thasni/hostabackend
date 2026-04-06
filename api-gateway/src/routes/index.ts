import express from "express";
import ambulanceRoutes from "./ambulance.routes";
import userRoutes from "./user.routes";

import bloodRoutes from "./blood.routes";
import bloodBankRoutes from "./bloodBank.routes";
import pharmacyRoutes from "./pharmacy.routes";

const router = express.Router();

router.use("/", bloodRoutes);
router.use("/", bloodBankRoutes);
router.use("/", ambulanceRoutes);
router.use("/", userRoutes);
router.use("/", pharmacyRoutes);


export default router;
