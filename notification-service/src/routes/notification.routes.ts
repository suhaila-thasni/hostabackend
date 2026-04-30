import { Router } from "express";
import {
  createNotification,
  getanNotification,
  updateData,
  notificationDelete,
  getNotification,
  getAllReadNotifications,
  getAllUnreadNotifications
} from "../controllers/notification.controllers";
import { authenticate } from "../middleware/authenticate";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  createNotificationSchema,
  updateNotificationSchema,
  getByRoleParamsSchema
} from "../validations/notification.validation";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// CRUD
router.post(
  "/notification/register",
  validate(createNotificationSchema),
  createNotification
);

router.get("/notification", getNotification);

router.get("/notification/:id", getanNotification);

router.put(
  "/notification/:id",
  validate(updateNotificationSchema),
  updateData
);

router.delete("/notification/:id", notificationDelete);

router.get(
  "/notification/unread/:id/:role",
  validateParams(getByRoleParamsSchema),
  getAllUnreadNotifications
);

router.get(
  "/notification/read/:id/:role",
  validateParams(getByRoleParamsSchema),
  getAllReadNotifications
);

export default router;





