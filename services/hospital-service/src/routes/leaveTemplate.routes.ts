import { Router } from "express";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  createLeaveTemplateSchema,
  updateLeaveTemplateSchema,
  leaveTemplateIdParamSchema,
  duplicateTemplateSchema,
} from "../validators/leaveTemplate.validator";
import {
  createLeaveTemplate,
  getLeaveTemplates,
  getPredefinedLeaveTemplates,
  getLeaveTemplateById,
  duplicateLeaveTemplate,
  updateLeaveTemplate,
  deleteLeaveTemplate,
} from "../controllers/leaveTemplate.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

/* =========================================================================
   LEAVE TEMPLATE ROUTES
========================================================================= */

// 1. Create a leave template (custom for employee or predefined by admin)
router.post(
  "/leave-templates",
  // authenticate, checkPermission("LeaveTemplate", "create"),
  validate(createLeaveTemplateSchema),
  createLeaveTemplate
);

// 2. Get predefined templates only
router.get(
  "/leave-templates/predefined",
  // authenticate, checkPermission("LeaveTemplate", "view"),
  getPredefinedLeaveTemplates
);

// 3. Get all templates with filters (?isPredefined=true/false, ?employeeId=10, ?reasonCategory=...)
router.get(
  "/leave-templates",
  // authenticate, checkPermission("LeaveTemplate", "view"),
  getLeaveTemplates
);

// 4. Get single template by ID
router.get(
  "/leave-templates/:id",
  // authenticate, checkPermission("LeaveTemplate", "view"),
  validateParams(leaveTemplateIdParamSchema),
  getLeaveTemplateById
);

// 5. Duplicate a template into "My Templates"
router.post(
  "/leave-templates/:id/duplicate",
  // authenticate, checkPermission("LeaveTemplate", "create"),
  validateParams(leaveTemplateIdParamSchema),
  validate(duplicateTemplateSchema),
  duplicateLeaveTemplate
);

// 6. Update a leave template
router.put(
  "/leave-templates/:id",
  // authenticate, checkPermission("LeaveTemplate", "edit"),
  validateParams(leaveTemplateIdParamSchema),
  validate(updateLeaveTemplateSchema),
  updateLeaveTemplate
);

// 7. Delete a leave template
router.delete(
  "/leave-templates/:id",
  // authenticate, checkPermission("LeaveTemplate", "delete"),
  validateParams(leaveTemplateIdParamSchema),
  deleteLeaveTemplate
);

export default router;
