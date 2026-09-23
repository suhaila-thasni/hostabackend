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

const router = Router();

router.post("/", validate(rfidCardAssignmentSchema), assignRfidCard);
router.get("/", getRfidCardAssignments);
router.get("/:id", validateParams(idParamSchema), getRfidCardAssignmentById);
router.put("/:id", validateParams(idParamSchema), validate(updateRfidCardAssignmentSchema), updateRfidCardAssignment);
router.put("/:id/deactivate", validateParams(idParamSchema), deactivateRfidCardAssignment);
router.put("/:id/activate", validateParams(idParamSchema), activateRfidCardAssignment);

export default router;
