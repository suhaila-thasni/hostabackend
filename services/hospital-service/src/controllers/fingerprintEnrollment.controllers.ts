import { Request, Response } from "express";
import crypto from "crypto";
import FingerprintEnrollment from "../models/fingerprintEnrollment.model";
import RfidDevice from "../models/Device.model";
import { logger } from "../utils/logger";

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
      employeeCode,
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

    const fingerprintHash = resolveFingerprintHash(req.body);

    const [enrollment, created] = await FingerprintEnrollment.upsert(
      {
        hospitalId,
        employeeId,
        employeeType,
        employeeName,
        employeeCode,
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
      },
      { returning: true }
    );

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? "Fingerprint enrolled successfully." : "Fingerprint enrollment updated successfully.",
      data: enrollment,
    });
  } catch (error: any) {
    logger.error("Error creating fingerprint enrollment", { error });
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
