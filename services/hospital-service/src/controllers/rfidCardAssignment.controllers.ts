import { Request, Response } from "express";
import RfidCardAssignment from "../models/rfidCardAssignment.model";
import RfidDevice from "../models/Device.model";
import { logger } from "../utils/logger";
import { publishEvent } from "../events/publisher";
import Hospital from "../models/hospital.model";

export const assignRfidCard = async (req: Request, res: Response) => {
  try {
    const {
      hospitalId,
      employeeId,
      employeeType,
      employeeName,
      department,
      deviceId,
      deviceDbId,
      cardNumber,
    } = req.body;

    const device = await RfidDevice.findOne({
      where: {
        ...(deviceDbId ? { id: deviceDbId } : { deviceId }),
        hospitalId,
        deviceType: "rfid",
        status: "Active",
      },
    });

    if (!device) {
      res.status(404).json({
        success: false,
        message: "Active RFID device not found for this hospital.",
      });
      return;
    }

    const [assignment, created] = await RfidCardAssignment.upsert(
      {
        hospitalId,
        employeeId,
        employeeType,
        employeeName,
        department,
        deviceId: device.deviceId,
        deviceDbId: device.id,
        cardNumber,
        status: "Active",
        assignedAt: new Date(),
      },
      { returning: true }
    );







     // Publish ACCESSCARD_ASSIGNED event
    try {
      const hospital = await Hospital.findByPk(assignment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "ACCESSCARD_ASSIGNED", {
        id: assignment.id,
        hospitalId: assignment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: assignment.deviceId,
        employeeId: assignment.employeeId,
        employeeType: assignment.employeeType,
        employeeName: assignment.employeeName,
        department: assignment.department,
        cardNumber: assignment.cardNumber,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish ACCESSCARD_ASSIGNED event:", { error: err.message });
    }







    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? "RFID card assigned successfully." : "RFID card assignment updated successfully.",
      data: assignment,
    });
  } catch (error: any) {
    logger.error("Error assigning RFID card", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRfidCardAssignments = async (req: Request, res: Response) => {
  try {
    const where: any = {};
    if (req.query.hospitalId) where.hospitalId = req.query.hospitalId;
    if (req.query.employeeId) where.employeeId = req.query.employeeId;
    if (req.query.employeeType) where.employeeType = req.query.employeeType;
    if (req.query.deviceId) where.deviceId = req.query.deviceId;
    if (req.query.status) where.status = req.query.status;
    if (req.query.cardNumber) where.cardNumber = req.query.cardNumber;

    const assignments = await RfidCardAssignment.findAll({
      where,
      order: [["assignedAt", "DESC"]],
    });

    res.status(200).json({ success: true, data: assignments });
  } catch (error: any) {
    logger.error("Error fetching RFID card assignments", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRfidCardAssignmentById = async (req: Request, res: Response) => {
  try {
    const assignment = await RfidCardAssignment.findByPk(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: "RFID card assignment not found." });
      return;
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error: any) {
    logger.error("Error fetching RFID card assignment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRfidCardAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await RfidCardAssignment.findByPk(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: "RFID card assignment not found." });
      return;
    }

    await assignment.update(req.body);




     // Publish ACCESSCARD_UPDATED event
    try {
      const hospital = await Hospital.findByPk(assignment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "ACCESSCARD_UPDATED", {
        id: assignment.id,
        hospitalId: assignment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: assignment.deviceId,
        employeeId: assignment.employeeId,
        employeeType: assignment.employeeType,
        employeeName: assignment.employeeName,
        department: assignment.department,
        cardNumber: assignment.cardNumber,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish ACCESSCARD_UPDATED event:", { error: err.message });
    }






    res.status(200).json({
      success: true,
      message: "RFID card assignment updated successfully.",
      data: assignment,
    });
  } catch (error: any) {
    logger.error("Error updating RFID card assignment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deactivateRfidCardAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await RfidCardAssignment.findByPk(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: "RFID card assignment not found." });
      return;
    }

    assignment.status = "Inactive";
    await assignment.save();


     // Publish ACCESSCARD_DEACTIVATED event
    try {
      const hospital = await Hospital.findByPk(assignment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "ACCESSCARD_DEACTIVATED", {
        id: assignment.id,
        hospitalId: assignment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: assignment.deviceId,
        employeeId: assignment.employeeId,
        employeeType: assignment.employeeType,
        employeeName: assignment.employeeName,
        department: assignment.department,
        cardNumber: assignment.cardNumber,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish ACCESSCARD_DEACTIVATED event:", { error: err.message });
    }



 

    res.status(200).json({
      success: true,
      message: "RFID card assignment deactivated successfully.",
      data: assignment,
    });
  } catch (error: any) {
    logger.error("Error deactivating RFID card assignment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateRfidCardAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await RfidCardAssignment.findByPk(req.params.id);
    if (!assignment) {
      res.status(404).json({ success: false, message: "RFID card assignment not found." });
      return;
    }

    assignment.status = "Active";
    await assignment.save();




        
     // Publish ACCESSCARD_ACTIVATED event
    try {
      const hospital = await Hospital.findByPk(assignment.hospitalId, { attributes: ["name"] });
      await publishEvent("hospital_events", "ACCESSCARD_ACTIVATED", {
        id: assignment.id,
        hospitalId: assignment.hospitalId,
        hospitalName: hospital?.name || "Unknown Hospital",
        deviceId: assignment.deviceId,
        employeeId: assignment.employeeId,
        employeeType: assignment.employeeType,
        employeeName: assignment.employeeName,
        department: assignment.department,
        cardNumber: assignment.cardNumber,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
      });
    } catch (err: any) {
      logger.error("Failed to publish ACCESSCARD_ACTIVATED event:", { error: err.message });
    }






    res.status(200).json({
      success: true,
      message: "RFID card assignment activated successfully.",
      data: assignment,
    });
  } catch (error: any) {
    logger.error("Error activating RFID card assignment", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};
