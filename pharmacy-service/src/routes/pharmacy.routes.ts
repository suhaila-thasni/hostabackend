import { Router } from "express";
import{
    createOrUpdatestock,
    getPharmacies,
    getPharmacy,
    deletePharmacy,
} from "../controllers/pharmacy.controller";

const router = Router();

router.post("/", createOrUpdatestock);
router.put("/", createOrUpdatestock);
router.get("/", getPharmacies);
router.get("/:id", getPharmacy);
router.delete("/:id", deletePharmacy);

export default router;