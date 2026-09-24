import { Router } from "express";
import {
  registerDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  unregisterDevice,
  restoreDevice,
  permanentlyDeleteDevice,
  regenerateCredentials,
  getDeviceEmployees,
} from "../controllers/Device.controllers";
import { validate } from "../middleware/validate.middleware";
import {
  registerRfidDeviceSchema,
  updateRfidDeviceSchema,
} from "../validators/Device.validator";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

// Register new RFID device
router.post("/register", authenticate, checkPermission("Device", "create"), validate(registerRfidDeviceSchema), registerDevice);

// Get all RFID devices (filtered by hospitalId/status)
router.get("/", authenticate, checkPermission("Device", "view"),getDevices);

// Get a single RFID device by ID
router.get("/:id", authenticate, checkPermission("Device", "view"),getDeviceById);

// Update a specific RFID device (Active/Disabled toggle, details)
router.put("/:id",authenticate,checkPermission("Device","update"),validate(updateRfidDeviceSchema),updateDevice);

// Unregister device (Soft delete, revoke credentials)
router.put("/:id/unregister",authenticate,checkPermission("Device","edit"), unregisterDevice);

// Restore device (Generates new credentials)
router.put("/:id/restore", authenticate, checkPermission("Device", "edit"),restoreDevice);

// Regenerate credentials for an active/disabled device
router.put("/:id/regenerate-credentials",authenticate,checkPermission("Device", "edit"), regenerateCredentials);

// Permanently delete device (Only if unregistered)
router.delete("/:id/permanent",authenticate,checkPermission("Device", "delete"),permanentlyDeleteDevice);

// Get assigned employees for a device
router.get("/:id/employees", authenticate, checkPermission("Device", "view"),getDeviceEmployees);

export default router;
