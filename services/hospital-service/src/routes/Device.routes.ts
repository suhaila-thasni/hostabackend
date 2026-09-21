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
} from "../controllers/rfidDevice.controllers";
import { validate } from "../middleware/validate.middleware";
import {
  registerRfidDeviceSchema,
  updateRfidDeviceSchema,
} from "../validators/Device.validator";

const router = Router();

// Register new RFID device
router.post(
  "/register",
  validate(registerRfidDeviceSchema),
  registerDevice
);

// Get all RFID devices (filtered by hospitalId/status)
router.get("/", getDevices);

// Get a single RFID device by ID
router.get("/:id", getDeviceById);

// Update a specific RFID device (Active/Disabled toggle, details)
router.put(
  "/:id",
  validate(updateRfidDeviceSchema),
  updateDevice
);

// Unregister device (Soft delete, revoke credentials)
router.put("/:id/unregister", unregisterDevice);

// Restore device (Generates new credentials)
router.put("/:id/restore", restoreDevice);

// Regenerate credentials for an active/disabled device
router.put("/:id/regenerate-credentials", regenerateCredentials);

// Permanently delete device (Only if unregistered)
router.delete("/:id/permanent", permanentlyDeleteDevice);

// Get assigned employees for a device
router.get("/:id/employees", getDeviceEmployees);

export default router;
