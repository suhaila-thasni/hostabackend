import { Router } from "express";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  attendanceSchema,
  updateAttendanceSchema,
  idParamSchema,
  rfidAttendanceSchema,
  fingerprintAttendanceSchema,
} from "../validators/attendance.validator";
import {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  getDailyStatus,
  createRfidAttendance,
  createFingerprintAttendance,
} from "../controllers/attendance.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

router.post("/attendances", validate(attendanceSchema), createAttendance);
router.post("/attendances/card", validate(rfidAttendanceSchema), createRfidAttendance);
router.post("/attendances/fingerprint", validate(fingerprintAttendanceSchema), createFingerprintAttendance);
router.get("/attendances", authenticate, checkPermission("Attendance", "view"), getAttendances);
router.get("/attendances/status", authenticate, checkPermission("Attendance", "view"), getDailyStatus);
router.get("/attendances/fingerprint", authenticate, checkPermission("Attendance", "view"), getAttendances);
router.get("/attendances/:id", authenticate, checkPermission("Attendance", "view"),validateParams(idParamSchema), getAttendanceById);
router.put("/attendances/:id",validateParams(idParamSchema), validate(updateAttendanceSchema), updateAttendance);
router.delete("/attendances/:id",validateParams(idParamSchema), deleteAttendance);

export default router;
