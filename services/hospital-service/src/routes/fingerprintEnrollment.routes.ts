import { Router } from "express";
import { validate, validateParams } from "../middleware/validate.middleware";
import { idParamSchema } from "../validators/attendance.validator";
import {
  fingerprintEnrollmentSchema,
  updateFingerprintEnrollmentSchema,
} from "../validators/fingerprintEnrollment.validator";
import {
  createFingerprintEnrollment,
  deactivateFingerprintEnrollment,
  getFingerprintEnrollmentById,
  getFingerprintEnrollments,
  updateFingerprintEnrollment,
} from "../controllers/fingerprintEnrollment.controllers";

const router = Router();

router.post("/", validate(fingerprintEnrollmentSchema), createFingerprintEnrollment);
router.get("/", getFingerprintEnrollments);
router.get("/:id", validateParams(idParamSchema), getFingerprintEnrollmentById);
router.put("/:id", validateParams(idParamSchema), validate(updateFingerprintEnrollmentSchema), updateFingerprintEnrollment);
router.put("/:id/deactivate", validateParams(idParamSchema), deactivateFingerprintEnrollment);

export default router;
