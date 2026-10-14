import { Request, Response } from "express";
import axios from "axios";
import Holiday from "../models/holiday.model";
import { publishEvent } from "../events/publisher";
import { logger } from "../utils/logger";

export const publishHolidayNotification = async (
  action: "CREATED" | "UPDATED" | "DELETED",
  holiday: any
) => {
  try {
    let eventName = "";
    let title = "";
    let message = "";
    let severity = "info";

    switch (action) {
      case "CREATED":
        eventName = "HOLIDAY_CREATED";
        title = "New Holiday Added";
        const formattedDate = new Date(holiday.startDate).toDateString(); // e.g., "Fri Dec 25 2026"
        message = `A new holiday '${holiday.name}' has been scheduled for ${formattedDate}.`;
        severity = "success";
        break;
      case "UPDATED":
        eventName = "HOLIDAY_UPDATED";
        title = "Holiday Updated";
        message = `The holiday '${holiday.name}' has been updated.`;
        severity = "info";
        break;
      case "DELETED":
        eventName = "HOLIDAY_DELETED";
        title = "Holiday Removed";
        message = `The holiday '${holiday.name}' was removed.`;
        severity = "warning";
        break;
    }

    // Fetch all staff and doctor IDs for this hospital so notification-service can fan out
    let staffIds: number[] = [];
    let doctorIds: number[] = [];

    if (holiday.hospitalId) {
      try {
        const staffRes = await axios.get(`${process.env.STAFF_SERVICE_URL}/staff`, {
          params: { hospitalId: holiday.hospitalId },
        });
        staffIds = (staffRes.data?.data ?? []).map((s: any) => s.id).filter(Boolean);
      } catch (err) {
        logger.warn("Could not fetch staffIds for holiday notification", { hospitalId: holiday.hospitalId });
      }

      try {
        const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/doctor`, {
          params: { hospitalId: holiday.hospitalId },
        });
        doctorIds = (doctorRes.data?.data ?? []).map((d: any) => d.id).filter(Boolean);
      } catch (err) {
        logger.warn("Could not fetch doctorIds for holiday notification", { hospitalId: holiday.hospitalId });
      }
    }

    const eventPayload = {
      event: eventName,
      title,
      message,
      category: "holiday",
      severity,
      recipient: "both",
      staffIds,
      doctorIds,
      data: holiday,
      createdAt: new Date(),
    };

    await publishEvent("hospital_events", eventName, eventPayload);
    logger.info(`Successfully published ${eventName} to RabbitMQ for holiday ID ${holiday.id}`);
  } catch (err: any) {
    logger.error(`Failed to publish ${action} event:`, { error: err.message });
  }
};

// CREATE HOLIDAY
export const createHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const holiday = await Holiday.create(req.body);
    
    await publishHolidayNotification("CREATED", holiday);

    res.status(201).json({
      success: true,
      data: holiday,
      message: "Holiday created successfully",
    });
  } catch (error: any) {
    logger.error("Error creating holiday", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET HOLIDAYS
export const getHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hospitalId, year } = req.query;
    
    const whereClause: any = {};
    if (hospitalId) {
      const rawId = Array.isArray(hospitalId) ? hospitalId[0] : hospitalId;
      const parsedId = Number(rawId);
      if (!isNaN(parsedId)) {
        whereClause.hospitalId = parsedId;
      }
    }

    const holidays = await Holiday.findAll({
      where: whereClause,
      order: [["startDate", "ASC"]],
    });

    res.status(200).json({ success: true, data: holidays });
  } catch (error: any) {
    logger.error("Error fetching holidays", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET HOLIDAY BY ID
export const getHolidayById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
      res.status(404).json({ success: false, message: "Holiday not found" });
      return;
    }

    res.status(200).json({ success: true, data: holiday });
  } catch (error: any) {
    logger.error("Error fetching holiday", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE HOLIDAY
export const updateHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
      res.status(404).json({ success: false, message: "Holiday not found" });
      return;
    }

    await holiday.update(req.body);

    await publishHolidayNotification("UPDATED", holiday);

    res.status(200).json({
      success: true,
      data: holiday,
      message: "Holiday updated successfully",
    });
  } catch (error: any) {
    logger.error("Error updating holiday", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE HOLIDAY
export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findByPk(id);

    if (!holiday) {
      res.status(404).json({ success: false, message: "Holiday not found" });
      return;
    }

    await holiday.destroy();

    await publishHolidayNotification("DELETED", holiday);

    res.status(200).json({ success: true, message: "Holiday deleted successfully" });
  } catch (error: any) {
    logger.error("Error deleting holiday", { error });
    res.status(500).json({ success: false, message: error.message });
  }
};
