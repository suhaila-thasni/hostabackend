import { Router } from "express";
import { validate, validateParams } from "../middleware/validate.middleware";
import {
  attendanceSchema,
  updateAttendanceSchema,
  idParamSchema,
  rfidAttendanceSchema,
  fingerprintAttendanceSchema,
  manualAttendanceSchema,
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
  createManualAttendance,
} from "../controllers/attendance.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";

const router = Router();

router.post("/attendances", 
  // authenticate, checkPermission("Attendance", "create"), 
  validate(attendanceSchema), createAttendance);
router.post("/attendances/card", 
  // authenticate, checkPermission("Attendance", "create"), 
  validate(rfidAttendanceSchema), createRfidAttendance);
router.post("/attendances/fingerprint", 
  // authenticate, checkPermission("Attendance", "create"), 
  validate(fingerprintAttendanceSchema), createFingerprintAttendance);
router.post("/attendances/manual",
  //  authenticate, checkPermission("Attendance", "create"),
    validate(manualAttendanceSchema), createManualAttendance);
router.get("/attendances/manual", 
  authenticate, checkPermission("Attendance", "view"), (req, res, next) => {
  req.query.method = "Manual";
  return getAttendances(req, res);
});
router.get("/attendances", authenticate, checkPermission("Attendance", "view"), getAttendances);
router.get("/attendances/status", authenticate, checkPermission("Attendance", "view"), getDailyStatus);
router.get("/attendances/fingerprint", authenticate, checkPermission("Attendance", "view"), getAttendances);
router.get("/attendances/:id", authenticate, checkPermission("Attendance", "view"),validateParams(idParamSchema), getAttendanceById);
router.put("/attendances/:id", authenticate,
  //  checkPermission("Attendance", "edit"),
   validateParams(idParamSchema), validate(updateAttendanceSchema), updateAttendance);
router.delete("/attendances/:id",
  //  authenticate, checkPermission("Attendance", "delete"),
   validateParams(idParamSchema), deleteAttendance);

export default router;
