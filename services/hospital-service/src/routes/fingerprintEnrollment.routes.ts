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
  activateFingerprintEnrollment,
  getFingerprintEnrollmentById,
  getFingerprintEnrollments,
  updateFingerprintEnrollment,
} from "../controllers/fingerprintEnrollment.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, checkPermission("Fingerprint", "create"), validate(fingerprintEnrollmentSchema), createFingerprintEnrollment);
router.get("/", authenticate, checkPermission("Fingerprint", "view"), getFingerprintEnrollments);
router.get("/:id", authenticate, checkPermission("Fingerprint", "view"), validateParams(idParamSchema), getFingerprintEnrollmentById);
router.put("/:id", authenticate, checkPermission("Fingerprint", "edit"), validateParams(idParamSchema), validate(updateFingerprintEnrollmentSchema), updateFingerprintEnrollment);
router.put("/:id/deactivate", authenticate, checkPermission("Fingerprint", "edit"), validateParams(idParamSchema), deactivateFingerprintEnrollment);
router.put("/:id/activate", authenticate, checkPermission("Fingerprint", "edit"), validateParams(idParamSchema), activateFingerprintEnrollment);

export default router;
