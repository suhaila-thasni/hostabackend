import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Notification from "../models/notification.model";
import { publishEvent } from "../events/publisher";

// CREATE - POST /notification/register
export const createNotification: any = asyncHandler(async (req: Request, res: Response) => {
  const { userId, hospitalId, labId, staffId, pharmacyId, doctorId, message } = req.body;

  const newNotification = await Notification.create({
    userId, hospitalId, labId, staffId, pharmacyId, doctorId, message
  });

  await publishEvent("notification_events", "NOTIFICATION_CREATED", {
    notificationId: newNotification.id,
  });

  res.status(201).json({
    success: true,
    message: "Notification created successfully",
    data: newNotification,
    error: null,
  });
});

// GET ONE - GET /notification/:id
export const getanNotification: any = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) {
    res.status(404).json({
      success: false,
      message: "Notification not found",
      data: null,
      error: { code: "NOTIFICATION_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: notification,
    error: null,
  });
});

// GET ALL UNREAD - GET /notification/unread/:id/:role
export const getAllUnreadNotifications: any = asyncHandler(async (req: Request, res: Response) => {
  const { id, role } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let whereCondition: any = {};

  switch (role) {
    case "user": whereCondition = { userId: id, userIsRead: false }; break;
    case "doctor": whereCondition = { doctorId: id, doctorIsRead: false }; break;
    case "staff": whereCondition = { staffId: id, staffIsRead: false }; break;
    case "lab": whereCondition = { labId: id, labIsRead: false }; break;
    case "pharmacy": whereCondition = { pharmacyId: id, pharmacyIsRead: false }; break;
    case "hospital": whereCondition = { hospitalId: id, hospitalIsRead: false }; break;
    default:
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
  }

  const { count, rows: notifications } = await Notification.findAndCountAll({
    where: whereCondition,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  res.status(200).json({
    success: true,
    status: "Success",
    data: notifications,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      limit
    },
    error: null,
  });
});

// GET ALL READ - GET /notification/read/:id/:role
export const getAllReadNotifications: any = asyncHandler(async (req: Request, res: Response) => {
  const { id, role } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let whereCondition: any = {};

  switch (role) {
    case "user": whereCondition = { userId: id, userIsRead: true }; break;
    case "doctor": whereCondition = { doctorId: id, doctorIsRead: true }; break;
    case "staff": whereCondition = { staffId: id, staffIsRead: true }; break;
    case "lab": whereCondition = { labId: id, labIsRead: true }; break;
    case "pharmacy": whereCondition = { pharmacyId: id, pharmacyIsRead: true }; break;
    case "hospital": whereCondition = { hospitalId: id, hospitalIsRead: true }; break;
    default:
      res.status(400).json({ success: false, message: "Invalid role" });
      return;
  }

  const { count, rows: notifications } = await Notification.findAndCountAll({
    where: whereCondition,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  res.status(200).json({
    success: true,
    status: "Success",
    data: notifications,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      limit
    },
    error: null,
  });
});

// UPDATE - PUT /notification/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  // Prevent updating restricted fields
  delete updatePayload.userId;
  delete updatePayload.hospitalId;
  delete updatePayload.doctorId;
  delete updatePayload.labId;
  delete updatePayload.staffId;
  delete updatePayload.pharmacyId;

  const [affectedCount, updatedNotifications] = await Notification.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (affectedCount === 0) {
    res.status(404).json({
      success: false,
      message: "Notification not found",
      data: null,
      error: { code: "NOTIFICATION_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("notification_events", "NOTIFICATION_UPDATED", {
    notificationId: updatedNotifications[0].id,
  });

  res.status(200).json({
    success: true,
    message: "Successfully updated",
    data: updatedNotifications[0],
    error: null,
  });
});

// DELETE - DELETE /notification/:id
export const notificationDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await Notification.destroy({
    where: { id: id }
  });

  if (!deleted) {
    res.status(404).json({
      success: false,
      message: "Notification not found",
      data: null,
      error: { code: "NOTIFICATION_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
    data: null,
    error: null,
  });
});

// GET ALL - GET /notification
export const getNotification: any = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const { count, rows: notifications } = await Notification.findAndCountAll({
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  res.status(200).json({
    success: true,
    status: "Success",
    data: notifications,
    pagination: {
      total: count,
      page,
      pages: Math.ceil(count / limit),
      limit
    },
    error: null,
  });
});


