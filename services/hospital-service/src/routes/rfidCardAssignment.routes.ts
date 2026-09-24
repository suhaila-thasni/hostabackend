import { Router } from "express";
import { validate, validateParams } from "../middleware/validate.middleware";
import { idParamSchema } from "../validators/attendance.validator";
import {
  rfidCardAssignmentSchema,
  updateRfidCardAssignmentSchema,
} from "../validators/rfidCardAssignment.validator";
import {
  assignRfidCard,
  deactivateRfidCardAssignment,
  activateRfidCardAssignment,
  getRfidCardAssignmentById,
  getRfidCardAssignments,
  updateRfidCardAssignment,
} from "../controllers/rfidCardAssignment.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

router.post("/", authenticate, checkPermission("Access card", "create"), validate(rfidCardAssignmentSchema), assignRfidCard);
router.get("/", authenticate, checkPermission("Access card", "view"), getRfidCardAssignments);
router.get("/:id", authenticate, checkPermission("Access card", "view"), validateParams(idParamSchema), getRfidCardAssignmentById);
router.put("/:id", authenticate, checkPermission("Access card", "edit"), validateParams(idParamSchema), validate(updateRfidCardAssignmentSchema), updateRfidCardAssignment);
router.put("/:id/deactivate", authenticate, checkPermission("Access card", "edit"), validateParams(idParamSchema), deactivateRfidCardAssignment);
router.put("/:id/activate", authenticate, checkPermission("Access card", "edit"), validateParams(idParamSchema), activateRfidCardAssignment);

export default router;
