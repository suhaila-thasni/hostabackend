import { Router } from "express";
import {
  createDonor,
  getDonors,
  getSingleDonor,
  updateDonor,
  deleteDonor,
} from "../controllers/blood.controller";

const router = Router();

router.post("/donors", createDonor);
router.get("/donors", getDonors);
router.get("/donors/:id", getSingleDonor);
router.put("/donors/:id", updateDonor);
router.delete("/donors/:id", deleteDonor);

export default router;
