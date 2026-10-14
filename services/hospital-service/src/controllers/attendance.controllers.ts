import { Request, Response } from "express";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";
import axios from "axios";
import Attendance from "../models/attendance.model";
import Hospital from "../models/hospital.model";
import RfidDevice from "../models/Device.model";
import RfidCardAssignment from "../models/rfidCardAssignment.model";
import FingerprintEnrollment from "../models/fingerprintEnrollment.model";
import { publishEvent } from "../events/publisher";
import { logger } from "../utils/logger";
import { verificationService } from "../services/verification.service";
import { createFingerprintHash } from "./fingerprintEnrollment.controllers";

export const publishAttendanceNotification = async (
  action: "CHECK_IN" | "CHECK_OUT" | "MANUAL" | "UPDATED" | "DELETED",
  attendance: any,
  staffName: string
) => {
  try {
    let eventName = "";
    let title = "";
    let message = "";
    let severity = "success";
    let recipient = "employee";

    const formatIST = (dateVal?: Date | string | null) => {
      const d = dateVal ? new Date(dateVal) : new Date();
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const checkInTimeStr = formatIST(attendance.checkInTime) || formatIST(new Date());
    const checkOutTimeStr = formatIST(attendance.checkOutTime) || formatIST(new Date());

    switch (action) {
      case "CHECK_IN":
        eventName = "ATTENDANCE_CHECKED_IN";
        recipient = "both";
        if (attendance.status === "Late") {
          title = "Late Check-in Recorded";
          severity = "warning";
          message = `${staffName} checked in at ${checkInTimeStr}, which is late.`;
        } else {
          title = "Attendance Check-in Successful";
          message = `${staffName}, your check-in has been recorded successfully at ${checkInTimeStr}. You are marked ${attendance.status}.`;
        }
        break;
      case "CHECK_OUT":
        eventName = "ATTENDANCE_CHECKED_OUT";
        recipient = "both";
        title = "Shift Completed Successfully";
        message = `${staffName}, your check-out has been recorded at ${checkOutTimeStr}. Total duration: ${attendance.duration || "N/A"}.`;
        break;
      case "MANUAL":
        eventName = "ATTENDANCE_CREATED_MANUALLY";
        title = "Manual Attendance Created";
        message = `${staffName}, your attendance was recorded manually by the hospital administrator.`;
        recipient = "employee";
        break;
      case "UPDATED":
        eventName = "ATTENDANCE_UPDATED";
        title = "Attendance Record Updated";
        message = `${staffName}, your attendance record has been updated by an administrator.`;
        recipient = "employee";
        break;
      case "DELETED":
        eventName = "ATTENDANCE_DELETED";
        title = "Attendance Record Deleted";
        message = `${staffName}, your attendance record was removed by an authorized administrator.`;
        recipient = "employee";
        severity = "warning";
        break;
    }

    const eventPayload = {
      event: eventName,
      title,
      message,
      category: "attendance",
      severity,
      recipient,
      data: {
        attendanceId: attendance.id,
        employeeId: attendance.employeeId,
        employeeType: attendance.employeeType,
        hospitalId: attendance.hospitalId,
        type: attendance.type,
        status: attendance.status,
        method: attendance.method,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
      },
      createdAt: new Date(),
    };
    await publishEvent("hospital_events", eventName, eventPayload);
    logger.info(`Successfully published ${eventName} to RabbitMQ for attendance ID ${attendance.id}`);
  } catch (err: any) {
    logger.error(`Failed to publish ${action} event:`, { error: err.message });
  }
};

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

  const targetTimeStr = timestamp.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const targetTime = new Date(targetTimeStr);
  const currentHours = targetTime.getHours();
  const currentMinutes = targetTime.getMinutes();
  let status = "verified";

  const normType = type ? type.toLowerCase() : "";

  if (normType === "check-in") {
    if (currentHours > expectedStartHours || (currentHours === expectedStartHours && currentMinutes > expectedStartMins)) {
      status = "Late";
    } else {
      status = "Present";
    }
  } else if (normType === "check-out") {
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
      latitude,
      longitude,
      image,
      selfie_url,
      method,
      roles,
      department,
      location,
      cardNumber,
    } = req.body;
    const type = req.body.type ? req.body.type.toLowerCase() : "";

    const resolvedEmployeeId = Number(employeeId ?? roleId);
    if (!resolvedEmployeeId && !cardNumber) {
      res.status(400).json({
        success: false,
        message: "employeeId (or roleId) or cardNumber is required in request body.",
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

    const queryOr: any[] = [];
    if (resolvedEmployeeId) {
      queryOr.push({ employeeId: resolvedEmployeeId }, { roleId: resolvedEmployeeId });
    }
    if (cardNumber) {
      queryOr.push({ cardNumber });
    }

    const existingRecord = await Attendance.findOne({
      where: {
        [Op.or]: queryOr,
        employeeType: resolvedEmployeeType,
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
        cardNumber,
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
      existingRecord.type = type;
      if (cardNumber) existingRecord.cardNumber = cardNumber;
      if (final_selfie_url) existingRecord.selfie_url = final_selfie_url;
      await existingRecord.save();
      attendance = existingRecord;
    }

    // 8. Publish event via RabbitMQ
    const actionType = attendance.type === "check-in" ? "CHECK_IN" : "CHECK_OUT";
    await publishAttendanceNotification(actionType, attendance, staffName);

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
    if (req.query.method) where.method = { [Op.iLike]: String(req.query.method) };
    if (req.query.creator_type) where.creator_type = req.query.creator_type;

    if (req.query.search) {
      const searchParam = req.query.search;
      const searchString = Array.isArray(searchParam) ? searchParam[0] : searchParam;
      const searchTerm = `%${searchString}%`;
      const searchCondition = {
        [Op.or]: [
          { name: { [Op.iLike]: searchTerm } },
          { employeeType: { [Op.iLike]: searchTerm } }
        ]
      };

      // If there's already an Op.or (e.g. from employeeId/roleId), we need to use Op.and to combine them
      if (where[Op.or]) {
        const existingOr = where[Op.or];
        delete where[Op.or];
        where[Op.and] = [{ [Op.or]: existingOr }, searchCondition];
      } else {
        Object.assign(where, searchCondition);
      }
    }
    const todayParam = req.query.today;
    const isTodayFilter = todayParam === 'true' || (Array.isArray(todayParam) && todayParam.includes('true'));

    if (isTodayFilter) {
      // Get today's date in IST
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(now.getTime() + istOffset);
      const todayStr = nowIST.toISOString().split('T')[0]; // YYYY-MM-DD in IST
      // IST day boundaries converted to UTC via explicit offset
      const startUTC = new Date(todayStr + 'T00:00:00.000+05:30');
      const endUTC = new Date(todayStr + 'T23:59:59.999+05:30');
      where.timestamp = { [Op.gte]: startUTC, [Op.lte]: endUTC };
      logger.info("TODAY FILTER APPLIED", { todayStr, startUTC: startUTC.toISOString(), endUTC: endUTC.toISOString() });
    } else if (req.query.date) {
      const dateParam = req.query.date;
      const dateStr = Array.isArray(dateParam) ? dateParam[0] : dateParam; // expected YYYY-MM-DD
      const startUTC = new Date(dateStr + 'T00:00:00.000+05:30');
      const endUTC = new Date(dateStr + 'T23:59:59.999+05:30');
      where.timestamp = { [Op.gte]: startUTC, [Op.lte]: endUTC };
    }

    logger.info("ATTENDANCE QUERY WHERE", { where: JSON.stringify(where), query: req.query });

    const attendances = await Attendance.findAll({
      where,
      order: [["timestamp", "DESC"]],
    });
    logger.info("ATTENDANCE QUERY RESULTS", { count: attendances.length });
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
          [Op.lte]: endOfDay
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

    const updateData: any = { ...req.body };
    const dateString = updateData.date || attendance.date || new Date().toISOString().split("T")[0];

    // Handle checkInTime if 12-hr / HH:mm time string provided
    if (updateData.checkInTime && typeof updateData.checkInTime === "string" && !updateData.checkInTime.includes("T")) {
      updateData.checkInTime = new Date(`${dateString}T${convertTo24Hr(updateData.checkInTime)}`);
    }

    // Handle checkOutTime if 12-hr / HH:mm time string provided
    if (updateData.checkOutTime && typeof updateData.checkOutTime === "string" && !updateData.checkOutTime.includes("T")) {
      updateData.checkOutTime = new Date(`${dateString}T${convertTo24Hr(updateData.checkOutTime)}`);
    }

    // Recalculate duration if both checkIn and checkOut are available
    const finalCheckIn = updateData.checkInTime ? new Date(updateData.checkInTime) : attendance.checkInTime ? new Date(attendance.checkInTime) : undefined;
    const finalCheckOut = updateData.checkOutTime ? new Date(updateData.checkOutTime) : attendance.checkOutTime ? new Date(attendance.checkOutTime) : undefined;

    if (finalCheckIn && finalCheckOut) {
      const diffMs = finalCheckOut.getTime() - finalCheckIn.getTime();
      if (diffMs > 0) {
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        updateData.duration = `${diffHrs}h ${diffMins}m`;
      }
    }

    await attendance.update(updateData);

    const staffName = attendance.name || "Employee";
    await publishAttendanceNotification("UPDATED", attendance, staffName);

    res.status(200).json({ success: true, message: "Attendance updated successfully", data: attendance });
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

    const staffName = attendance.name || "Employee";
    await publishAttendanceNotification("DELETED", attendance, staffName);

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
    // 1. Device Authentication
    const apiKey = req.headers["x-api-key"] as string;
    const secretKey = req.headers["x-secret-key"] as string;
    const headerDeviceId = req.headers["x-device-id"] as string;

    if (!apiKey || !secretKey || !headerDeviceId) {
      res.status(401).json({ success: false, message: "Unauthorized: Missing device credentials in headers." });
      return;
    }

    const device = await RfidDevice.findOne({ where: { apiKey, deviceId: headerDeviceId, status: "Active" } });
    if (!device) {
      res.status(401).json({ success: false, message: "Unauthorized: Invalid API Key or inactive device." });
      return;
    }

    const isSecretValid = await device.verifySecret(secretKey);
    if (!isSecretValid) {
      res.status(401).json({ success: false, message: "Unauthorized: Invalid Secret Key." });
      return;
    }

    // Use hospitalId and deviceId from the authenticated device, overriding the body
    const hospitalId = device.hospitalId;
    const deviceId = device.deviceId;
    const { accessCardUid, type, latitude, longitude } = req.body;

    // 2. Look up employee by accessCardUid from local rfid_card_assignments table first
    let employeeData = null;
    let employeeType = "Staff";

    const cardAssignment = await RfidCardAssignment.findOne({
      where: { cardNumber: accessCardUid, hospitalId, status: "Active" },
    });

    if (cardAssignment) {
      // Found in local rfid_card_assignments — fetch full employee data from the relevant service
      employeeType = cardAssignment.employeeType;
      const empId = cardAssignment.employeeId;

      try {
        if (employeeType === "Doctor") {
          const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3007"}/doctor/internal/${empId}`, {
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
            validateStatus: () => true,
          });
          if (doctorRes.status === 200 && doctorRes.data?.success) {
            employeeData = doctorRes.data.data;
          }
        } else {
          const staffRes = await axios.get(`${process.env.STAFF_SERVICE_URL || "http://staff-service:3006"}/staff/internal/${empId}`, {
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
            validateStatus: () => true,
          });
          if (staffRes.status === 200 && staffRes.data?.success) {
            employeeData = staffRes.data.data;
          }
        }
      } catch (err: any) {
        logger.error("Failed to fetch employee details from card assignment", { error: err.message });
      }

      // If service call failed, use the card assignment data as fallback
      if (!employeeData) {
        employeeData = {
          id: cardAssignment.employeeId,
          name: cardAssignment.employeeName,
          department: cardAssignment.department,
          employeeType: cardAssignment.employeeType,
        };
      }
    }

    // 3. Fallback: look up by accessCardUid from doctor/staff services directly
    if (!employeeData) {
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
    }

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

    // 3. Duplicate check & Record Retrieval
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const existingRecord = await Attendance.findOne({
      where: {
        [Op.or]: [
          { employeeId: resolvedEmployeeId },
          { roleId: resolvedEmployeeId }
        ],
        employeeType: employeeType,
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

    const staffName = employeeData?.displayName || employeeData?.name || employeeData?.username || (employeeData?.firstName ? `${employeeData.firstName} ${employeeData.lastName || ''}`.trim() : "Unknown");
    const staffDepartment = employeeData?.department || employeeData?.designation;

    let attendance;
    if (type === "check-in" || !existingRecord) {
      attendance = await Attendance.create({
        hospitalId,
        employeeId: resolvedEmployeeId,
        employeeType: employeeType,
        roleId: resolvedRoleId || resolvedEmployeeId,
        name: staffName,
        type,
        date: dateString,
        checkInTime: type === "check-in" ? timestamp : undefined,
        checkOutTime: type === "check-out" ? timestamp : undefined,
        timestamp,
        latitude,
        longitude,
        status,
        method: "RFID",
        deviceId,
        cardNumber: accessCardUid,
        roles: [employeeType],
        department: staffDepartment,
      });
    } else {
      // type === "check-out" and existingRecord exists (check-in)
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
      existingRecord.type = type;
      await existingRecord.save();
      attendance = existingRecord;
    }

    const actionType = attendance.type === "check-in" ? "CHECK_IN" : "CHECK_OUT";
    await publishAttendanceNotification(actionType, attendance, staffName);

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

/* =======================
   FINGERPRINT ATTENDANCE
======================= */

export const createFingerprintAttendance = async (req: Request, res: Response) => {
  try {
    // 1. Device Authentication
    const apiKey = req.headers["x-api-key"] as string;
    const secretKey = req.headers["x-secret-key"] as string;
    const headerDeviceId = req.headers["x-device-id"] as string;

    if (!apiKey || !secretKey || !headerDeviceId) {
      res.status(401).json({ success: false, message: "Unauthorized: Missing device credentials in headers." });
      return;
    }

    const device = await RfidDevice.findOne({
      where: {
        apiKey,
        deviceId: headerDeviceId,
        deviceType: "fingerprint",
        status: "Active",
      },
    });

    if (!device) {
      res.status(401).json({ success: false, message: "Unauthorized: Invalid API Key or inactive fingerprint device." });
      return;
    }

    const isSecretValid = await device.verifySecret(secretKey);
    if (!isSecretValid) {
      res.status(401).json({ success: false, message: "Unauthorized: Invalid Secret Key." });
      return;
    }

    const { fingerprintTemplate, fingerprintHash, templateReference, type } = req.body;
    const resolvedFingerprintHash =
      fingerprintHash ||
      createFingerprintHash(fingerprintTemplate || templateReference);

    // 2. Resolve employee from active enrollment
    const enrollment = await FingerprintEnrollment.findOne({
      where: {
        hospitalId: device.hospitalId,
        fingerprintHash: resolvedFingerprintHash,
        status: "Active",
      },
    });

    if (!enrollment) {
      res.status(404).json({ success: false, message: "No active employee fingerprint enrollment found." });
      return;
    }

    const hospitalId = device.hospitalId;
    const deviceId = device.deviceId;
    const resolvedEmployeeId = enrollment.employeeId;
    const employeeType = enrollment.employeeType;
    const now = new Date();

    // 3. Duplicate check & Record Retrieval
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dateString = now.toISOString().split("T")[0];

    const existingRecord = await Attendance.findOne({
      where: {
        [Op.or]: [
          { employeeId: resolvedEmployeeId },
          { roleId: resolvedEmployeeId },
        ],
        employeeType: employeeType,
        timestamp: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
    });

    if (type === "check-in" && existingRecord && existingRecord.checkInTime) {
      res.status(400).json({
        success: false,
        message: "You have already checked in for today.",
      });
      return;
    }

    if (type === "check-out" && existingRecord && existingRecord.checkOutTime) {
      res.status(400).json({
        success: false,
        message: "You have already checked out for today.",
      });
      return;
    }

    // 4. Fetch employee details for schedule/status enrichment
    let employeeData: any = null;
    try {
      const serviceUrl =
        employeeType === "Doctor"
          ? `${process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3007"}/doctor/internal/${resolvedEmployeeId}`
          : `${process.env.STAFF_SERVICE_URL || "http://staff-service:3006"}/staff/internal/${resolvedEmployeeId}`;

      const employeeRes = await axios.get(serviceUrl, {
        timeout: 10000,
        validateStatus: () => true,
        headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
      });

      if (employeeRes.status === 200 && employeeRes.data?.success) {
        employeeData = employeeRes.data.data;
      }
    } catch (err: any) {
      logger.error("Failed to fetch employee details for fingerprint attendance", { error: err.message });
    }

    const timestamp = new Date();
    const status = getAttendanceStatus(type, timestamp, employeeType, employeeData);
    const staffName =
      employeeData?.displayName ||
      employeeData?.name ||
      employeeData?.username ||
      enrollment.employeeName ||
      "Unknown";
    const staffDepartment =
      employeeData?.department ||
      employeeData?.designation ||
      enrollment.department;

    let attendance;
    if (type === "check-in" || !existingRecord) {
      attendance = await Attendance.create({
        hospitalId,
        employeeId: resolvedEmployeeId,
        employeeType,
        roleId: employeeData?.roleId || resolvedEmployeeId,
        name: staffName,
        type,
        date: dateString,
        checkInTime: type === "check-in" ? timestamp : undefined,
        checkOutTime: type === "check-out" ? timestamp : undefined,
        timestamp,
        status,
        method: "Fingerprint",
        deviceId,
        roles: [employeeType],
        department: staffDepartment,
      });
    } else {
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
      existingRecord.type = type;
      existingRecord.method = "Fingerprint";
      existingRecord.deviceId = deviceId;
      await existingRecord.save();
      attendance = existingRecord;
    }

    const actionType = attendance.type === "check-in" ? "CHECK_IN" : "CHECK_OUT";
    await publishAttendanceNotification(actionType, attendance, staffName);

    res.status(201).json({
      success: true,
      status,
      message: `${type} successful via Fingerprint`,
      data: attendance,
    });
  } catch (error: any) {
    logger.error("Error creating fingerprint attendance", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   CREATE MANUAL ATTENDANCE
   (Admin creates full attendance record in one shot)
======================= */

export const createManualAttendance = async (req: Request, res: Response) => {
  try {
    const {
      hospitalId,
      employeeId,
      employeeType,
      date,
      checkInTime,
      checkOutTime,
      status,
      method,
      notes,
      department,
    } = req.body;

    const resolvedEmployeeId = Number(employeeId);
    if (!resolvedEmployeeId) {
      res.status(400).json({
        success: false,
        message: "employeeId is required.",
      });
      return;
    }

    const resolvedEmployeeType = employeeType || "Staff";

    // Build date values
    const dateString = date || new Date().toISOString().split("T")[0];

    // Parse check-in / check-out times into full Date objects
    let parsedCheckIn: Date | undefined;
    let parsedCheckOut: Date | undefined;

    if (checkInTime) {
      parsedCheckIn = new Date(`${dateString}T${convertTo24Hr(checkInTime)}`);
    }
    if (checkOutTime) {
      parsedCheckOut = new Date(`${dateString}T${convertTo24Hr(checkOutTime)}`);
    }

    // Calculate duration if both times are provided
    let durationStr: string | undefined;
    if (parsedCheckIn && parsedCheckOut) {
      const diffMs = parsedCheckOut.getTime() - parsedCheckIn.getTime();
      if (diffMs > 0) {
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        durationStr = `${diffHrs}h ${diffMins}m`;
      }
    }

    // Fetch employee name
    let staffName = "Unknown staff";
    let staffRole = resolvedEmployeeType;
    let staffDepartment = department;

    try {
      if (resolvedEmployeeType.toLowerCase() === "doctor") {
        const doctorResponse = await axios.get(
          `${process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3007"}/doctor/internal/${resolvedEmployeeId}`,
          {
            timeout: 10000,
            validateStatus: () => true,
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
          }
        );
        if (doctorResponse.status === 200 && doctorResponse.data?.success) {
          const docData = doctorResponse.data.data;
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
            headers: { "x-service-secret": process.env.INTERNAL_SERVICE_SECRET || "mySuperSecret123" },
          }
        );
        if (staffResponse.status === 200 && staffResponse.data?.success) {
          const staffData = staffResponse.data.data;
          staffName = staffData?.name || staffData?.username || staffName;
          staffRole = staffData?.role || staffRole;
          staffDepartment = staffData?.department || staffData?.designation || staffDepartment;
        }
      }
    } catch (error: any) {
      logger.error("Failed to fetch employee details for manual attendance:", { error: error.message });
    }

    const attendance = await Attendance.create({
      hospitalId,
      employeeId: resolvedEmployeeId,
      employeeType: staffRole,
      roleId: resolvedEmployeeId,
      name: staffName,
      type: parsedCheckOut ? "check-out" : "check-in",
      date: dateString,
      checkInTime: parsedCheckIn,
      checkOutTime: parsedCheckOut,
      timestamp: parsedCheckIn || new Date(),
      status: status || "Present",
      method: method || "Manual",
      roles: [staffRole],
      department: staffDepartment,
      duration: durationStr,
      notes,
      creator_type: "Admin",
    });

    // Publish event
    await publishAttendanceNotification("MANUAL", attendance, staffName);

    res.status(201).json({
      success: true,
      message: "Manual attendance created successfully",
      data: attendance,
    });
  } catch (error: any) {
    logger.error("Error creating manual attendance", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   HELPER: Convert 12-hr time to 24-hr format
   e.g. "09:00 AM" -> "09:00:00", "06:00 PM" -> "18:00:00"
======================= */
function convertTo24Hr(timeStr: string): string {
  // If already in 24-hr format (e.g. "09:00" or "18:00:00")
  if (!timeStr.match(/AM|PM/i)) {
    return timeStr.includes(":") && timeStr.split(":").length === 2 ? `${timeStr}:00` : timeStr;
  }

  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return timeStr;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
}

