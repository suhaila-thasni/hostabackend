import { Request, Response } from "express";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import axios from "axios";
import Attendance from "../models/attendance.model";
import Hospital from "../models/hospital.model";
import { publishEvent } from "../events/publisher";
import { logger } from "../utils/logger";
import { verificationService } from "../services/verification.service";

export const getAttendanceStatus = (
  type: string, 
  timestamp: Date, 
  employeeType: string, 
  employeeData: any
): string => {
  let expectedStartHours = 9;
  let expectedStartMins = 0;
  let expectedEndHours = 17;
  let expectedEndMins = 0;

  const parseTime = (timeStr: string) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    const mod = match[3];
    if (mod) {
      if (mod.toUpperCase() === "PM" && h < 12) h += 12;
      if (mod.toUpperCase() === "AM" && h === 12) h = 0;
    }
    return { hours: h, minutes: m };
  };

  if (employeeType && employeeType.toLowerCase() === "doctor" && employeeData) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayStr = days[timestamp.getDay()];
    
    let startStr, endStr;
    if (employeeData.consultingOne && Array.isArray(employeeData.consultingOne)) {
      const todaySchedule = employeeData.consultingOne.find((s: any) => s.day === currentDayStr);
      if (todaySchedule) {
        startStr = todaySchedule.start_time;
        endStr = todaySchedule.end_time;
      }
    } else if (employeeData.consultingTwo && Array.isArray(employeeData.consultingTwo)) {
       const todaySchedule = employeeData.consultingTwo.find((s: any) => s.day === currentDayStr);
       if (todaySchedule) {
         if (todaySchedule.morning_session) {
           startStr = todaySchedule.morning_session.open;
           if (!todaySchedule.evening_session) endStr = todaySchedule.morning_session.close;
         }
         if (todaySchedule.evening_session) {
           if (!startStr) startStr = todaySchedule.evening_session.open;
           endStr = todaySchedule.evening_session.close;
         }
       }
    }
    
    if (startStr) {
      const parsedStart = parseTime(startStr);
      if (parsedStart) { expectedStartHours = parsedStart.hours; expectedStartMins = parsedStart.minutes; }
    }
    if (endStr) {
      const parsedEnd = parseTime(endStr);
      if (parsedEnd) { expectedEndHours = parsedEnd.hours; expectedEndMins = parsedEnd.minutes; }
    }
  } else if (employeeData) {
    if (employeeData.shiftStartTime) {
      const parsedStart = parseTime(employeeData.shiftStartTime);
      if (parsedStart) { expectedStartHours = parsedStart.hours; expectedStartMins = parsedStart.minutes; }
    }
    if (employeeData.shiftEndTime) {
      const parsedEnd = parseTime(employeeData.shiftEndTime);
      if (parsedEnd) { expectedEndHours = parsedEnd.hours; expectedEndMins = parsedEnd.minutes; }
    }
  }

  const currentHours = timestamp.getHours();
  const currentMinutes = timestamp.getMinutes();
  let status = "verified";

  if (type === "check-in") {
    if (currentHours > expectedStartHours || (currentHours === expectedStartHours && currentMinutes > expectedStartMins)) {
      status = "Late";
    } else {
      status = "Present";
    }
  } else if (type === "check-out") {
    let adjustedEnd = expectedEndHours;
    if (expectedEndHours < expectedStartHours) {
       adjustedEnd += 24;
    }
    let adjustedCurrent = currentHours;
    if (expectedEndHours < expectedStartHours && currentHours < expectedStartHours) {
       adjustedCurrent += 24;
    }

    if (adjustedCurrent < adjustedEnd || (adjustedCurrent === adjustedEnd && currentMinutes < expectedEndMins)) {
      status = "Early Departure";
    } else {
      status = "Shift Completed";
    }
  }
  
  return status;
};

/* =======================
   CREATE ATTENDANCE (Check-In / Check-Out)
======================= */

export const createAttendance = async (req: Request, res: Response) => {
  try {
    const {
      hospitalId,
      employeeId,
      employeeType,
      roleId,
      type,
      latitude,
      longitude,
      image,
      selfie_url,
      method,
      roles,
      department,
      location,
    } = req.body;

    const resolvedEmployeeId = Number(employeeId ?? roleId);
    if (!resolvedEmployeeId) {
      res.status(400).json({
        success: false,
        message: "employeeId (or roleId) is required in request body.",
      });
      return;
    }

    const resolvedEmployeeType = employeeType || (typeof roles === 'string' ? roles : (Array.isArray(roles) && roles.length ? (typeof roles[0] === 'string' ? roles[0] : roles[0]?.name) : "Staff"));
    const now = new Date();

    // Resolve coordinates from top-level or nested location object
    const resolvedLat = latitude ?? location?.lat;
    const resolvedLng = longitude ?? location?.lng;
    
    const finalImage = image || selfie_url;

    // 1. Find today's record (we'll use it for both check-in and check-out)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const existingRecord = await Attendance.findOne({
      where: {
        [Op.or]: [
          { employeeId: resolvedEmployeeId },
          { roleId: resolvedEmployeeId }
        ],
        timestamp: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    if (type === "check-in" && existingRecord && existingRecord.checkInTime) {
      res.status(400).json({
        success: false,
        message: `You have already checked in for today.`,
      });
      return;
    }
    
    if (type === "check-out" && existingRecord && existingRecord.checkOutTime) {
      res.status(400).json({
        success: false,
        message: `You have already checked out for today.`,
      });
      return;
    }

    // 2. Location Verification (if coordinates are provided)
    if (resolvedLat !== undefined && resolvedLng !== undefined) {
      const locationVerification = await verifyAttendanceLocation(hospitalId, resolvedLat, resolvedLng);
      if (!locationVerification.success) {
        res.status(403).json({
          success: false,
          message: locationVerification.message,
          distanceMeters: locationVerification.distanceMeters,
          allowedRadiusMeters: locationVerification.allowedRadiusMeters,
        });
        return;
      }
    }

    // 3. Face Verification Check (Only if method is "Face")
    if (method === "Face" || finalImage) {
      const verification = await verificationService.verifyFace(resolvedEmployeeId, finalImage, resolvedEmployeeType);
      if (!verification.success) {
        res.status(403).json({ 
          success: false, 
          message: verification.message 
        });
        return;
      }
    }

    const timestamp = new Date();

    // 4. Handle Image Storage (save selfie to disk if base64)
    let final_selfie_url = image || selfie_url || null;
    if (image && image.startsWith("data:image")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `attendance_${resolvedEmployeeId}_${Date.now()}.jpg`;

      const uploadDir = path.join(__dirname, "../../uploads/attendance");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPath = path.join(uploadDir, fileName);
      fs.writeFileSync(uploadPath, base64Data, "base64");
      final_selfie_url = `/uploads/attendance/${fileName}`;
    }

    const resolvedMethod = method || (image ? "Face" : "Punch In");

    // 5. Fetch name and shift times before creating/updating
    let staffName = "Unknown staff";
    let staffRole = resolvedEmployeeType;
    let staffDepartment = department;
    let employeeData = null;

    try {
      if (resolvedEmployeeType && resolvedEmployeeType.toLowerCase() === "doctor") {
        const doctorResponse = await axios.get(
          `${process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3007"}/doctor/internal/${resolvedEmployeeId}`,
          { 
            timeout: 10000, 
            validateStatus: () => true,
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" }
          }
        );
        if (doctorResponse.status === 200 && doctorResponse.data?.success) {
          const docData = doctorResponse.data.data;
          employeeData = docData;
          staffName = docData?.displayName || docData?.name || docData?.username || (docData?.firstName ? `${docData.firstName} ${docData.lastName || ''}`.trim() : staffName);
          staffRole = docData?.role || staffRole;
          staffDepartment = docData?.department || staffDepartment;
        }
      } else {
        const staffResponse = await axios.get(
          `${process.env.STAFF_SERVICE_URL || "http://staff-service:3006"}/staff/internal/${resolvedEmployeeId}`,
          { 
            timeout: 10000, 
            validateStatus: () => true,
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" }
          }
        );
        if (staffResponse.status === 200 && staffResponse.data?.success) {
          const staffData = staffResponse.data.data;
          employeeData = staffData;
          staffName = staffData?.name || staffData?.username || staffName;
          staffRole = staffData?.role || staffRole;
          staffDepartment = staffData?.department || staffData?.designation || staffDepartment;
        }
      }
    } catch (error: any) {
      logger.error("Failed to fetch employee details for attendance:", { error: error.message });
    }

    // 6. Determine status (Late vs Present for check-in, Early vs Completed for check-out)
    const status = getAttendanceStatus(type, timestamp, resolvedEmployeeType, employeeData);

    // 7. Create or update the attendance record
    let attendance;
    if (type === "check-in" || !existingRecord) {
      attendance = await Attendance.create({
        hospitalId,
        employeeId: resolvedEmployeeId,
        employeeType: staffRole,
        roleId: resolvedEmployeeId,
        name: staffName,
        type,
        attendanceType: "Shift",
        date: dateString,
        checkInTime: type === "check-in" ? timestamp : undefined,
        checkOutTime: type === "check-out" ? timestamp : undefined,
        timestamp,
        latitude: resolvedLat,
        longitude: resolvedLng,
        selfie_url: final_selfie_url,
        status,
        method: resolvedMethod,
        roles: roles || [staffRole],
        department: staffDepartment,
      });
    } else {
      // type === "check-out"
      let durationStr = existingRecord.duration || "0h 0m";
      if (existingRecord.checkInTime) {
        const diffMs = timestamp.getTime() - new Date(existingRecord.checkInTime).getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        durationStr = `${diffHrs}h ${diffMins}m`;
      }

      existingRecord.checkOutTime = timestamp;
      existingRecord.duration = durationStr;
      existingRecord.status = status;
      if (final_selfie_url) existingRecord.selfie_url = final_selfie_url;
      await existingRecord.save();
      attendance = existingRecord;
    }

    // 8. Publish event via RabbitMQ
    try {
      await publishEvent("hospital_events", "ATTENDANCE_REGISTERED", {
        attendanceId: attendance.id,
        employeeId: attendance.employeeId,
        employeeType: attendance.employeeType,
        roleId: attendance.roleId,
        staffName,
        staffRole,
        type: attendance.type,
        status: attendance.status,
        method: attendance.method,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        hospitalId: attendance.hospitalId,
      });
    } catch (err: any) {
      logger.error("Failed to publish ATTENDANCE_REGISTERED event:", { error: err.message });
    }

    res.status(201).json({
      success: true,
      status,
      message: `${type} successful`,
      data: attendance,
    });
  } catch (error: any) {
    logger.error("Error creating attendance", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   GET ALL ATTENDANCES (with filters)
======================= */

export const getAttendances = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.query.hospitalId) where.hospitalId = req.query.hospitalId;
    
    const targetId = req.query.employeeId || req.query.roleId;
    if (targetId) {
      where[Op.or] = [{ employeeId: targetId }, { roleId: targetId }];
    }
    if (req.query.employeeType) where.employeeType = req.query.employeeType;
    if (req.query.status) where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;
    if (req.query.department) where.department = req.query.department;

    const attendances = await Attendance.findAll({
      where,
      order: [["timestamp", "DESC"]],
    });
    res.status(200).json({ success: true, data: attendances });
  } catch (error: any) {
    logger.error("Error fetching attendances", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   GET DAILY STATUS (check-in / check-out status for today)
======================= */

export const getDailyStatus = async (req: Request, res: Response) => {
  try {
    const targetId = Number(req.query.employeeId || req.query.roleId || req.params.employeeId || req.params.roleId);
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const attendances = await Attendance.findAll({
      where: {
        [Op.or]: [{ employeeId: targetId }, { roleId: targetId }],
        timestamp: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    const hasCheckedIn = attendances.some((r: any) => r.type === "check-in");
    const hasCheckedOut = attendances.some((r: any) => r.type === "check-out");

    res.json({ success: true, hasCheckedIn, hasCheckedOut });
  } catch (error: any) {
    logger.error("Error fetching daily status", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   GET SINGLE ATTENDANCE
======================= */

export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) {
      res.status(404).json({ success: false, message: "Attendance not found" });
      return;
    }
    res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    logger.error("Error fetching attendance by id", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   UPDATE ATTENDANCE
======================= */

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) {
      res.status(404).json({ success: false, message: "Attendance not found" });
      return;
    }
    await attendance.update(req.body);

    try {
      await publishEvent("hospital_events", "ATTENDANCE_UPDATED", {
        attendanceId: attendance.id,
        roleId: attendance.roleId,
        hospitalId: attendance.hospitalId,
        type: attendance.type,
        status: attendance.status,
        checkInTime: attendance.type === "check-in" ? attendance.timestamp : undefined,
        checkOutTime: attendance.type === "check-out" ? attendance.timestamp : undefined,
      });
    } catch (err: any) {
      logger.error("Failed to publish ATTENDANCE_UPDATED event:", { error: err.message });
    }

    res.status(200).json({ success: true, data: attendance });
  } catch (error: any) {
    logger.error("Error updating attendance", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   DELETE ATTENDANCE (soft delete via paranoid)
======================= */

export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);
    if (!attendance) {
      res.status(404).json({ success: false, message: "Attendance not found" });
      return;
    }
    await attendance.destroy(); // Soft delete (paranoid mode sets deletedAt)

    try {
      await publishEvent("hospital_events", "ATTENDANCE_DELETED", {
        attendanceId: attendance.id,
        roleId: attendance.roleId,
        hospitalId: attendance.hospitalId,
        type: attendance.type,
        status: attendance.status,
      });
    } catch (err: any) {
      logger.error("Failed to publish ATTENDANCE_DELETED event:", { error: err.message });
    }

    res.status(200).json({ success: true, message: "Attendance deleted successfully" });
  } catch (error: any) {
    logger.error("Error deleting attendance", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   LOCATION VERIFICATION HELPER
======================= */

interface LocationVerificationResult {
  success: boolean;
  message: string;
  distanceMeters?: number;
  allowedRadiusMeters?: number;
}

async function verifyAttendanceLocation(
  hospitalId: number,
  latitude: number,
  longitude: number
): Promise<LocationVerificationResult> {
  if (!isValidCoordinate(latitude, longitude)) {
    return {
      success: false,
      message: "Location verification failed: valid latitude and longitude are required.",
    };
  }

  try {
    // Fetch hospital coordinates directly from the database
    const hospital = await Hospital.findByPk(hospitalId);

    if (!hospital) {
      return {
        success: false,
        message: "Location verification failed: hospital details could not be found.",
      };
    }

    const hospitalLat = Number(hospital.latitude);
    const hospitalLng = Number(hospital.longitude);

    if (!isValidCoordinate(hospitalLat, hospitalLng)) {
      return {
        success: false,
        message: "Location verification failed: hospital does not have valid coordinates configured.",
      };
    }

    const distanceMeters = calculateDistanceMeters(latitude, longitude, hospitalLat, hospitalLng);
    const allowedRadiusMeters = 500; // Default: 500m radius around hospital

    if (distanceMeters > allowedRadiusMeters) {
      return {
        success: false,
        message: `Location verification failed: staff is ${Math.round(distanceMeters)}m from the hospital, outside the allowed ${allowedRadiusMeters}m radius.`,
        distanceMeters,
        allowedRadiusMeters,
      };
    }

    return {
      success: true,
      message: "Location verified successfully.",
      distanceMeters,
      allowedRadiusMeters,
    };
  } catch (error: any) {
    logger.error("Location verification error:", { error: error.message });
    return {
      success: false,
      message: "Location verification service error.",
    };
  }
}

function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371e3;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/* =======================
   RFID ATTENDANCE
======================= */

export const createRfidAttendance = async (req: Request, res: Response) => {
  try {
    const { hospitalId, accessCardUid, type, deviceId, latitude, longitude } = req.body;
    
    // 1. Look up doctor by accessCardUid
    let employeeData = null;
    let employeeType = "Staff";
    
    try {
      const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3007"}/doctor/internal/by-access-card/${accessCardUid}`, {
        params: { hospitalId },
        headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
        validateStatus: () => true
      });
      
      if (doctorRes.status === 200 && doctorRes.data?.success) {
        employeeData = doctorRes.data.data;
        employeeType = "Doctor";
      }
    } catch (err: any) {
      logger.error("Failed to query doctor service for RFID", { error: err.message });
    }
    
    // 2. If not doctor, look up staff
    if (!employeeData) {
      try {
        const staffRes = await axios.get(`${process.env.STAFF_SERVICE_URL || "http://staff-service:3006"}/staff/internal/by-access-card/${accessCardUid}`, {
          params: { hospitalId },
          headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
          validateStatus: () => true
        });
        
        if (staffRes.status === 200 && staffRes.data?.success) {
          employeeData = staffRes.data.data;
          employeeType = "Staff";
        }
      } catch (err: any) {
        logger.error("Failed to query staff service for RFID", { error: err.message });
      }
    }
    
    if (!employeeData) {
      res.status(404).json({ success: false, message: "No employee found with this access card." });
      return;
    }
    
    const resolvedEmployeeId = employeeData.id;
    const resolvedRoleId = employeeData.roleId;
    const now = new Date();
    
    // 3. Duplicate check
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const existingRecord = await Attendance.findOne({
      where: {
        [Op.or]: [
          { employeeId: resolvedEmployeeId },
          { roleId: resolvedEmployeeId }
        ],
        type,
        timestamp: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    if (existingRecord) {
      res.status(400).json({
        success: false,
        message: `You have already recorded a ${type} for today.`,
      });
      return;
    }
    
    // 4. Location Verification (if coordinates are provided)
    if (latitude !== undefined && longitude !== undefined) {
      const locationVerification = await verifyAttendanceLocation(hospitalId, latitude, longitude);
      if (!locationVerification.success) {
        res.status(403).json({
          success: false,
          message: locationVerification.message,
          distanceMeters: locationVerification.distanceMeters,
          allowedRadiusMeters: locationVerification.allowedRadiusMeters,
        });
        return;
      }
    }
    
    const timestamp = new Date();
    const status = getAttendanceStatus(type, timestamp, employeeType, employeeData);
    
    const attendance = await Attendance.create({
      hospitalId,
      employeeId: resolvedEmployeeId,
      employeeType: employeeType,
      roleId: resolvedRoleId || resolvedEmployeeId,
      type,
      timestamp,
      latitude,
      longitude,
      status,
      method: "Access Card",
      deviceId,
      roles: [employeeType],
    });
    
    try {
      await publishEvent("hospital_events", "ATTENDANCE_REGISTERED", {
        attendanceId: attendance.id,
        employeeId: attendance.employeeId,
        employeeType: attendance.employeeType,
        roleId: attendance.roleId,
        staffName: employeeData.name,
        staffRole: employeeType,
        type: attendance.type,
        status: attendance.status,
        method: attendance.method,
        checkInTime: attendance.type === "check-in" ? attendance.timestamp : undefined,
        checkOutTime: attendance.type === "check-out" ? attendance.timestamp : undefined,
        hospitalId: attendance.hospitalId,
      });
    } catch (err: any) {
      logger.error("Failed to publish ATTENDANCE_REGISTERED event:", { error: err.message });
    }

    res.status(201).json({
      success: true,
      status,
      message: `${type} successful via Access Card`,
      data: attendance,
    });
    
  } catch (error: any) {
    logger.error("Error creating RFID attendance", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};
