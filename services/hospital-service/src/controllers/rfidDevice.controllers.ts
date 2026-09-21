import { Request, Response } from "express";
import crypto from "crypto";
import RfidDevice from "../models/rfidDevice.model";
import { logger } from "../utils/logger";

/* =======================
   REGISTER NEW RFID DEVICE
======================= */
export const registerDevice = async (req: Request, res: Response) => {
  try {
    const { hospitalId, deviceId, deviceName, location, locationImage, deviceImage, deviceType } = req.body;

    // Check if device ID already exists
    const existingDevice = await RfidDevice.findOne({ where: { deviceId } });
    if (existingDevice) {
      res.status(400).json({ success: false, message: "Device ID already exists." });
      return;
    }

    // Generate API Key and Secret Key
    const apiKey = `hosta_dev_${crypto.randomBytes(8).toString("hex")}`;
    const plainSecretKey = crypto.randomBytes(32).toString("hex");

    // Save device (Secret key is hashed automatically by model hook)
    const newDevice = await RfidDevice.create({
      hospitalId,
      deviceId,
      deviceName,
      location,
      locationImage,
      deviceImage,
      deviceType,
      apiKey,
      secretKey: plainSecretKey,
    });

    res.status(201).json({
      success: true,
      message: "RFID Device registered successfully.",
      data: {
        id: newDevice.id,
        hospitalId: newDevice.hospitalId,
        deviceId: newDevice.deviceId,
        deviceName: newDevice.deviceName,
        location: newDevice.location,
        locationImage: newDevice.locationImage,
        deviceImage: newDevice.deviceImage,
        deviceType: newDevice.deviceType,
        status: newDevice.status,
      },
      credentials: {
        apiKey,
        secretKey: plainSecretKey,
        warning: "Please save the secret key securely. It will not be shown again.",
      },
    });
  } catch (error: any) {
    logger.error("Error registering RFID device", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   GET ONE DEVICE BY ID
======================= */
export const getDeviceById = async (req: Request, res: Response) => {
  try {
    const device = await RfidDevice.findByPk(req.params.id, {
      attributes: { exclude: ["secretKey"] },
    });

    if (!device) {
      res.status(404).json({ success: false, message: "Device not found." });
      return;
    }

    res.status(200).json({ success: true, data: device });
  } catch (error: any) {
    logger.error("Error fetching RFID device", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   GET ALL DEVICES
======================= */
export const getDevices = async (req: Request, res: Response) => {
  try {
    const whereClause: any = {};
    if (req.query.hospitalId) whereClause.hospitalId = req.query.hospitalId;
    if (req.query.status) whereClause.status = req.query.status;

    const devices = await RfidDevice.findAll({
      where: whereClause,
      attributes: { exclude: ["secretKey"] }, // Never return hashed secret key in listing
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: devices });
  } catch (error: any) {
    logger.error("Error fetching RFID devices", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   UPDATE DEVICE
======================= */
export const updateDevice = async (req: Request, res: Response) => {
  try {
    const deviceIdParam = req.params.id;
    const { deviceName, location, locationImage, deviceImage, deviceType, status, imageUrl } = req.body;

    const device = await RfidDevice.findByPk(deviceIdParam);
    if (!device) {
      res.status(404).json({ success: false, message: "Device not found." });
      return;
    }

    // Cannot update an unregistered device — must restore first
    if (device.status === "Unregistered") {
      res.status(400).json({ success: false, message: "Cannot update an unregistered device. Restore it first." });
      return;
    }

    if (deviceName) device.deviceName = deviceName;
    if (location) device.location = location;
    if (locationImage !== undefined) device.locationImage = locationImage;
    if (deviceImage !== undefined) device.deviceImage = deviceImage;
    if (imageUrl !== undefined) device.deviceImage = imageUrl;
    if (deviceType) device.deviceType = deviceType;
    if (status) device.status = status;

    await device.save();

    res.status(200).json({
      success: true,
      message: "Device updated successfully.",
      data: {
        id: device.id,
        hospitalId: device.hospitalId,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        location: device.location,
        locationImage: device.locationImage,
        deviceImage: device.deviceImage,
        deviceType: device.deviceType,
        status: device.status,
        apiKey: device.apiKey,
      },
    });
  } catch (error: any) {
    logger.error("Error updating RFID device", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   UNREGISTER DEVICE (Soft)
   - Sets status to "Unregistered"
   - Revokes the secret key
   - Records unregisteredAt timestamp
======================= */
export const unregisterDevice = async (req: Request, res: Response) => {
  try {
    const deviceIdParam = req.params.id;

    const device = await RfidDevice.findByPk(deviceIdParam);
    if (!device) {
      res.status(404).json({ success: false, message: "Device not found." });
      return;
    }

    if (device.status === "Unregistered") {
      res.status(400).json({ success: false, message: "Device is already unregistered." });
      return;
    }

    // Revoke the secret key by replacing it with a random unusable hash
    const revokedSecret = `revoked_${crypto.randomBytes(32).toString("hex")}`;
    device.secretKey = revokedSecret;
    device.status = "Unregistered";
    device.unregisteredAt = new Date();

    await device.save();

    res.status(200).json({
      success: true,
      message: "Device unregistered successfully. Credentials have been revoked.",
      data: {
        id: device.id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
        unregisteredAt: device.unregisteredAt,
      },
    });
  } catch (error: any) {
    logger.error("Error unregistering RFID device", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   RESTORE DEVICE
   - Sets status back to "Active"
   - Generates new API Key and Secret Key
   - Clears unregisteredAt
======================= */
export const restoreDevice = async (req: Request, res: Response) => {
  try {
    const deviceIdParam = req.params.id;

    const device = await RfidDevice.findByPk(deviceIdParam);
    if (!device) {
      res.status(404).json({ success: false, message: "Device not found." });
      return;
    }

    if (device.status !== "Unregistered") {
      res.status(400).json({ success: false, message: "Only unregistered devices can be restored." });
      return;
    }

    // Generate new credentials
    const newApiKey = `hosta_dev_${crypto.randomBytes(8).toString("hex")}`;
    const newPlainSecretKey = crypto.randomBytes(32).toString("hex");

    device.apiKey = newApiKey;
    device.secretKey = newPlainSecretKey; // Will be hashed by beforeUpdate hook
    device.status = "Active";
    device.unregisteredAt = null;

    await device.save();

    res.status(200).json({
      success: true,
      message: "Device restored successfully with new credentials.",
      data: {
        id: device.id,
        hospitalId: device.hospitalId,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        location: device.location,
        locationImage: device.locationImage,
        deviceType: device.deviceType,
        status: device.status,
      },
      credentials: {
        apiKey: newApiKey,
        secretKey: newPlainSecretKey,
        warning: "Please save the new secret key securely. It will not be shown again.",
      },
    });
  } catch (error: any) {
    logger.error("Error restoring RFID device", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   PERMANENTLY DELETE DEVICE
   - Only allowed for unregistered devices
   - Hard-deletes the row from DB
======================= */
export const permanentlyDeleteDevice = async (req: Request, res: Response) => {
  try {
    const deviceIdParam = req.params.id;

    const device = await RfidDevice.findByPk(deviceIdParam);
    if (!device) {
      res.status(404).json({ success: false, message: "Device not found." });
      return;
    }

    if (device.status !== "Unregistered") {
      res.status(400).json({
        success: false,
        message: "Only unregistered devices can be permanently deleted. Unregister the device first.",
      });
      return;
    }

    await device.destroy();

    res.status(200).json({
      success: true,
      message: "Device permanently deleted.",
    });
  } catch (error: any) {
    logger.error("Error permanently deleting RFID device", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =======================
   REGENERATE CREDENTIALS
   - Generates new API Key and Secret Key for an existing Active/Disabled device
======================= */
export const regenerateCredentials = async (req: Request, res: Response) => {
  try {
    const deviceIdParam = req.params.id;

    const device = await RfidDevice.findByPk(deviceIdParam);
    if (!device) {
      res.status(404).json({ success: false, message: "Device not found." });
      return;
    }

    if (device.status === "Unregistered") {
      res.status(400).json({ success: false, message: "Cannot regenerate credentials for an unregistered device. Use the restore endpoint instead." });
      return;
    }

    // Generate new credentials
    const newApiKey = `hosta_dev_${crypto.randomBytes(8).toString("hex")}`;
    const newPlainSecretKey = crypto.randomBytes(32).toString("hex");

    device.apiKey = newApiKey;
    device.secretKey = newPlainSecretKey; // Will be hashed by beforeUpdate hook
    
    await device.save();

    res.status(200).json({
      success: true,
      message: "Credentials regenerated successfully.",
      data: {
        id: device.id,
        hospitalId: device.hospitalId,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
      },
      credentials: {
        apiKey: newApiKey,
        secretKey: newPlainSecretKey,
        warning: "Please save the new secret key securely. It will not be shown again.",
      },
    });
  } catch (error: any) {
    logger.error("Error regenerating credentials for RFID device", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};
