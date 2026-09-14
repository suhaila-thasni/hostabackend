import { Request, Response } from "express";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import axios from "axios";
import Attendance from "../models/attendance.model";
import { publishEvent } from "../events/publisher";
import { logger } from "../utils/logger";

/* =======================
   CREATE ATTENDANCE (Check-In / Check-Out)
======================= */

export const createAttendance = async (req: Request, res: Response) => {
  try {
    const {
      hospitalId,
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

    const user_id = roleId;
    const now = new Date();

    // Resolve coordinates from top-level or nested location object
    const resolvedLat = latitude ?? location?.lat;
    const resolvedLng = longitude ?? location?.lng;

    // 1. Duplicate check - prevent double check-in/check-out for same day
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const existingRecord = await Attendance.findOne({
      where: {
        roleId: user_id,
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

    const timestamp = new Date();

    // 3. Handle Image Storage (save selfie to disk if base64)
    let final_selfie_url = image || selfie_url || null;
    if (image && image.startsWith("data:image")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `attendance_${user_id}_${Date.now()}.jpg`;

      const uploadDir = path.join(__dirname, "../../uploads/attendance");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPath = path.join(uploadDir, fileName);
      fs.writeFileSync(uploadPath, base64Data, "base64");
      final_selfie_url = `/uploads/attendance/${fileName}`;
    }

    // 4. Determine status (Late vs Present for check-in, Early vs Completed for check-out)
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    let status = "verified";

    if (type === "check-in") {
      // Default shift start: 09:00 AM
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        status = "Late";
      } else {
        status = "Present";
      }
    } else if (type === "check-out") {
      // Default shift end: 17:00 (5:00 PM)
      if (hours < 17) {
        status = "Early Departure";
      } else {
        status = "Shift Completed";
      }
    }

    // 5. Determine method
    const resolvedMethod = method || (image ? "Face" : "Punch In");

    // 6. Create the attendance record
    const attendance = await Attendance.create({
      hospitalId,
      roleId: user_id,
      type,
      timestamp,
      latitude: resolvedLat,
      longitude: resolvedLng,
      selfie_url: final_selfie_url,
      status,
      method: resolvedMethod,
      roles,
      department,
    });

    // 7. Publish event via RabbitMQ
    try {
      let staffName = "Unknown staff";
      let staffRole = "Unknown";

      try {
        const staffResponse = await axios.get(
          `${process.env.STAFF_SERVICE_URL || "http://staff-service:3006"}/staffs/${attendance.roleId}/details`,
          { timeout: 10000, validateStatus: () => true }
        );

        if (staffResponse.status === 200 && staffResponse.data?.success) {
          staffName = staffResponse.data.name || staffResponse.data.username || staffName;
          staffRole = staffResponse.data.role || staffRole;
        }
      } catch (error: any) {
        logger.error("Failed to enrich attendance event with staff details:", { error: error.message });
      }

      await publishEvent("hospital_events", "ATTENDANCE_REGISTERED", {
        attendanceId: attendance.id,
        roleId: attendance.roleId,
        staffName,
        staffRole,
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
    if (req.query.roleId) where.roleId = req.query.roleId;
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
    const roleId = Number(req.query.roleId || req.params.roleId);
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const attendances = await Attendance.findAll({
      where: {
        roleId,
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
    // Fetch hospital coordinates
    const hospitalResponse = await axios.get(
      `${process.env.HOSPITAL_SERVICE_URL || "http://localhost:3004"}/hospitals/${hospitalId}`,
      { timeout: 10000, validateStatus: () => true }
    );

    if (hospitalResponse.status !== 200 || !hospitalResponse.data?.success) {
      return {
        success: false,
        message: "Location verification failed: hospital details could not be fetched.",
      };
    }

    const hospital = hospitalResponse.data.data;
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
