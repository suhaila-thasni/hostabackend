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
//   checkPermission("template", "create"),
  createTemplate
);

router.get(
  "/",
  authenticate,
//   checkPermission("template", "view"),
  getTemplates
);

router.get(
  "/:id",
  authenticate,
//   checkPermission("template", "view"),
  getTemplateById
);

router.put(
  "/:id",
  validate(updateTemplateSchema),
  authenticate,
//   checkPermission("template", "edit"),
  updateTemplate
);

router.delete(
  "/:id",
  authenticate,
//   checkPermission("template", "delete"),
  deleteTemplate
);

export default router;
