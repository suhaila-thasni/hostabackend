import { Request, Response } from "express";
import crypto from "crypto";
import FingerprintEnrollment from "../models/fingerprintEnrollment.model";
import RfidDevice from "../models/Device.model";
import { logger } from "../utils/logger";
import Hospital from "../models/hospital.model";
import { publishEvent } from "../events/publisher";

export const createFingerprintHash = (value: string): string =>
  crypto.createHash("sha256").update(value.trim()).digest("hex");

const resolveFingerprintHash = (body: any): string => {
  if (body.fingerprintHash) return body.fingerprintHash.trim();
  if (body.fingerprintTemplate) return createFingerprintHash(body.fingerprintTemplate);
  return createFingerprintHash(body.templateReference);
};

export const createFingerprintEnrollment = async (req: Request, res: Response) => {
  try {
    const {
      hospitalId,
      employeeId,
      employeeType,
      employeeName,
      department,
      deviceId,
      deviceDbId,
      fingerPosition,
      templateReference,
      quality,
      attempts,
    } = req.body;

    const device = await RfidDevice.findOne({
      where: {
        ...(deviceDbId ? { id: deviceDbId } : { deviceId }),
        hospitalId,
        deviceType: "fingerprint",
        status: "Active",
      },
    });

    if (!device) {
      res.status(404).json({
        success: false,
        message: "Active fingerprint device not found for this hospital.",
      });
      return;
    }

    // Check if employee is already enrolled to this device
    const existingEnrollment = await FingerprintEnrollment.findOne({
      where: {
        hospitalId,
        employeeId,
        employeeType,
        deviceId: device.deviceId,
        status: "Active",
      },
    });

    if (existingEnrollment) {
      res.status(400).json({
        success: false,
        message: "Employee is already enrolled to this device.",
      });
      return;
    }

    const fingerprintHash = resolveFingerprintHash(req.body);

    const enrollment = await FingerprintEnrollment.create({
      hospitalId,
      employeeId,
      employeeType,
      employeeName,
      department,
      deviceId: device.deviceId,
      deviceDbId: device.id,
      fingerPosition: fingerPosition || "right-thumb",
      fingerprintHash,
      templateReference,
      quality: quality || "Good",
      attempts: attempts || 1,
      status: "Active",
      enrolledAt: new Date(),
    });




    
    // Publish FINGERPRINT_REGISTERED event
    try {
      const hospital = await Hospital.findByPk(enrollment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "FINGERPRINT_REGISTERED", {
        id: enrollment.id,
        hospitalId: enrollment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: enrollment.deviceId,
        employeeId: enrollment.employeeId,
        employeeType: enrollment.employeeType,
        employeeName: enrollment.employeeName,
        department: enrollment.department,
        fingerPosition: enrollment.fingerPosition,
        fingerprintHash: enrollment.fingerprintHash,
        templateReference: enrollment.templateReference,
        quality: enrollment.quality,
        attempts: enrollment.attempts,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish FINGERPRINT_REGISTERED event:", { error: err.message });
    }






    res.status(201).json({
      success: true,
      message: "Fingerprint enrolled successfully.",
      data: enrollment,
    });
  } catch (error: any) {
    logger.error("Error creating fingerprint enrollment", { error });

    // Handle unique constraint violation
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({
        success: false,
        message: "Employee is already enrolled to this device.",
      });
      return;
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFingerprintEnrollments = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.query.hospitalId) where.hospitalId = req.query.hospitalId;
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.employeeType) where.employeeType = req.query.employeeType;
    if (req.query.deviceId) where.deviceId = req.query.deviceId;
    if (req.query.status) where.status = req.query.status;

    const enrollments = await FingerprintEnrollment.findAll({
      where,
      order: [["enrolledAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: enrollments });
  } catch (error: any) {
    logger.error("Error fetching fingerprint enrollments", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFingerprintEnrollmentById = async (req: Request, res: Response) => {
  try {
    const enrollment = await FingerprintEnrollment.findByPk(req.params.id);
    if (!enrollment) {
      res.status(404).json({ success: false, message: "Fingerprint enrollment not found." });
      return;
    }

    res.status(200).json({ success: true, data: enrollment });
  } catch (error: any) {
    logger.error("Error fetching fingerprint enrollment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFingerprintEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await FingerprintEnrollment.findByPk(req.params.id);
    if (!enrollment) {
      res.status(404).json({ success: false, message: "Fingerprint enrollment not found." });
      return;
    }

    const updates = { ...req.body };
    delete updates.fingerprintTemplate;
    if (req.body.fingerprintTemplate || req.body.fingerprintHash || req.body.templateReference) {
      updates.fingerprintHash = resolveFingerprintHash(req.body);
    }

    await enrollment.update(updates);






    // Publish FINGERPRINT_UPDATED event
    try {
      const hospital = await Hospital.findByPk(enrollment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "FINGERPRINT_UPDATED", {
        id: enrollment.id,
        hospitalId: enrollment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: enrollment.deviceId,
        employeeId: enrollment.employeeId,
        employeeType: enrollment.employeeType,
        employeeName: enrollment.employeeName,
        department: enrollment.department,
        fingerPosition: enrollment.fingerPosition,
        fingerprintHash: enrollment.fingerprintHash,
        templateReference: enrollment.templateReference,
        quality: enrollment.quality,
        attempts: enrollment.attempts,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish FINGERPRINT_UPDATED event:", { error: err.message });
    }






    res.status(200).json({
      success: true,
      message: "Fingerprint enrollment updated successfully.",
      data: enrollment,
    });
  } catch (error: any) {
    logger.error("Error updating fingerprint enrollment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deactivateFingerprintEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await FingerprintEnrollment.findByPk(req.params.id);
    if (!enrollment) {
      res.status(404).json({ success: false, message: "Fingerprint enrollment not found." });
      return;
    }

    enrollment.status = "Inactive";
    await enrollment.save();



    // Publish FINGERPRINT_DEACTIVATED event
    try {
      const hospital = await Hospital.findByPk(enrollment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "FINGERPRINT_DEACTIVATED", {
        id: enrollment.id,
        hospitalId: enrollment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: enrollment.deviceId,
        employeeId: enrollment.employeeId,
        employeeType: enrollment.employeeType,
        employeeName: enrollment.employeeName,
        department: enrollment.department,
        fingerPosition: enrollment.fingerPosition,
        fingerprintHash: enrollment.fingerprintHash,
        templateReference: enrollment.templateReference,
        quality: enrollment.quality,
        attempts: enrollment.attempts,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish FINGERPRINT_DEACTIVATED event:", { error: err.message });
    }




    res.status(200).json({
      success: true,
      message: "Fingerprint enrollment deactivated successfully.",
      data: enrollment,
    });
  } catch (error: any) {
    logger.error("Error deactivating fingerprint enrollment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateFingerprintEnrollment = async (req: Request, res: Response) => {
  try {
    const enrollment = await FingerprintEnrollment.findByPk(req.params.id);
    if (!enrollment) {
      res.status(404).json({ success: false, message: "Fingerprint enrollment not found." });
      return;
    }

    enrollment.status = "Active";
    await enrollment.save();


    // Publish FINGERPRINT_ACTIVATED event
    try {
      const hospital = await Hospital.findByPk(enrollment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "FINGERPRINT_ACTIVATED", {
        id: enrollment.id,
        hospitalId: enrollment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: enrollment.deviceId,
        employeeId: enrollment.employeeId,
        employeeType: enrollment.employeeType,
        employeeName: enrollment.employeeName,
        department: enrollment.department,
        fingerPosition: enrollment.fingerPosition,
        fingerprintHash: enrollment.fingerprintHash,
        templateReference: enrollment.templateReference,
        quality: enrollment.quality,
        attempts: enrollment.attempts,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish FINGERPRINT_ACTIVATED event:", { error: err.message });
    }




    res.status(200).json({
      success: true,
      message: "Fingerprint enrollment activated successfully.",
      data: enrollment,
    });
  } catch (error: any) {
    logger.error("Error activating fingerprint enrollment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};
