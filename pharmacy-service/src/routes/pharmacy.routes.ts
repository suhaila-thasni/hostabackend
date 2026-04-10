import { Router } from "express";
import{
    createOrUpdatestock,
    getPharmacies,
    getPharmacy,
    updatePharmacy,
    deletePharmacy,
} from "../controllers/pharmacy.controller";

const router = Router();

router.post("/", createOrUpdatestock);
router.put("/:id", updatePharmacy);
router.get("/", getPharmacies);
router.get("/:id", getPharmacy);
router.delete("/:id", deletePharmacy);

export default router;