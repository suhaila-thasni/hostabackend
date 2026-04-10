import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Notification from "../models/notification.model";
import { publishEvent } from "../events/publisher";

// REGISTER - POST /notification/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  
  const { userId, hospitalId, labId, staffId, pharmacyId, doctorId, message } = req.body;


  const newNotification = await Notification.create({
   userId, hospitalId, labId, staffId, pharmacyId, doctorId, message
  });



  await publishEvent("notification_events", "NOTIFICATION_REGISTERED", {
    notificationId: newNotification.id,
    // phone: newStaff.phone,
  });

  res.status(201).json({
    success: true,
    message: "Notification created  successfully",
    data: null,
    error: null,
  });
});



// GET ONE - GET /notification/:id
export const getanNotification : any = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification) {
    res.status(404).json({
      success: false,
      message: "notification not found",
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


// GET ONE all un read notifications - GET /notification/unread/:id/:role
export const getAllUnreadNotifications: any =
  asyncHandler(async (req: Request, res: Response) => {

    const { id, role } = req.params;

    let whereCondition: any = {};

    switch (role) {

      case "user":
        whereCondition = {
          userId: id,
          userIsRead: false
        };
        break;

      case "doctor":
        whereCondition = {
          doctorId: id,
          doctorIsRead: false
        };
        break;

      case "staff":
        whereCondition = {
          staffId: id,
          staffIsRead: false
        };
        break;

      case "lab":
        whereCondition = {
          labId: id,
          labIsRead: false
        };
        break;

      case "pharmacy":
        whereCondition = {
          pharmacyId: id,
          pharmacyIsRead: false
        };
        break;

      case "hospital":
        whereCondition = {
          hospitalId: id,
          hospitalIsRead: false
        };
        break;

      default:
        res.status(400).json({
          success: false,
          message: "Invalid role",
        });
        return;

    }

    const notifications = await Notification.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      status: "Success",
      data: notifications,
      error: null,
    });

  });


  // GET ONE all  read notifications - GET /notification/read/:id/:role
export const getAllReadNotifications: any =
  asyncHandler(async (req: Request, res: Response) => {

    const { id, role } = req.params;

    let whereCondition: any = {};

    switch (role) {

      case "user":
        whereCondition = {
          userId: id,
          userIsRead: true
        };
        break;

      case "doctor":
        whereCondition = {
          doctorId: id,
          doctorIsRead: true
        };
        break;

      case "staff":
        whereCondition = {
          staffId: id,
          staffIsRead: true
        };
        break;

      case "lab":
        whereCondition = {
          labId: id,
          labIsRead: true
        };
        break;

      case "pharmacy":
        whereCondition = {
          pharmacyId: id,
          pharmacyIsRead: true
        };
        break;

      case "hospital":
        whereCondition = {
          hospitalId: id,
          hospitalIsRead: true
        };
        break;

      default:
        res.status(400).json({
          success: false,
          message: "Invalid role",
        });
        return;

    }

    const notifications = await Notification.findAll({
      where: whereCondition,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      status: "Success",
      data: notifications,
      error: null,
    });

  });




// UPDATE - PUT /notification/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const notification = await Notification.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!notification[1] || notification[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "notification not found",
      status: 200,
      data: null,
      error: { code: "NOTIFICATION_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("notification_events", "NOTIFICATION_UPDATED", {
    staffId: notification[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: notification[1][0],
    error: null,
  });
});

// DELETE - DELETE /notification/:id
export const notificationDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const staff = await Notification.findByPk(id);
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "notification not found",
      data: null,
      error: { code: "NOTIFICATION_NOT_FOUND", details: null },
    });
    return;
  }


  await Notification.destroy({
    where: { id: id }
  });


  res.status(200).json({
    success: true,
    message: "Your account deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});

// GET ALL - GET /notification
export const getNotification: any = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findAll();

  if (notification.length === 0) {
    res.status(404).json({
      success: false,
      message: "No data found",
      data: null,
      error: { code: "NO_DATA_FOUND", details: null },
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


