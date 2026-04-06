import { Router } from "express";
import {
  createDonor,
  getDonors,
  getSingleDonor,
  updateDonor,
  deleteDonor,
} from "../controllers/bloodDonor.controller";
import { validate, validateParams } from "../middleware/validate.middleware";
import { donorSchema, idParamSchema } from "../validators/blood.validator";

const router = Router();

router.post("/donors", validate(donorSchema), createDonor);
router.get("/donors", getDonors);
router.get("/donors/:id", validateParams(idParamSchema), getSingleDonor);
router.put("/donors/:id", validateParams(idParamSchema), updateDonor);
router.delete("/donors/:id", validateParams(idParamSchema), deleteDonor);

export default router;
