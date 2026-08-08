import express from "express";
import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "../controllers/template.controller";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "../validations/template.validation";

const router = express.Router();

router.post(
  "/",
  validate(createTemplateSchema),
  authenticate,
  checkPermission("Notification Templates", "create"),
  createTemplate
);

router.get(
  "/",
  authenticate,
  checkPermission("Notification Templates", "view"),
  getTemplates
);

router.get(
  "/:id",
  authenticate,
  checkPermission("Notification Templates", "view"),
  getTemplateById
);

router.put(
  "/:id",
  validate(updateTemplateSchema),
  authenticate,
  checkPermission("Notification Templates", "edit"),
  updateTemplate
);

router.delete(
  "/:id",
  authenticate,
  checkPermission("Notification Templates", "delete"),
  deleteTemplate
);

export default router;
