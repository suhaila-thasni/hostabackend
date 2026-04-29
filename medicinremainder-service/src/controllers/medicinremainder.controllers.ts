import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Medicinremainder from "../models/medicinremainder.model";
import { publishEvent } from "../events/publisher";
import axios from "axios";


const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3002";

// Helper: validate userId exists in user-service (forward the token so auth passes)
const validateUser = async (userId: number, authHeader: string): Promise<boolean> => {
  try {
    const res = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
      timeout: 5000,
      headers: { Authorization: authHeader },
    });
    return res.status === 200 && res.data?.success === true;
  } catch {
    return false;
  }
};

// REGISTER - POST /medicinremainder/register
export const Registeration: any = asyncHandler(async (req: any, res: Response) => {
  const { medicineName, dosage, days, timeSlots, startDate, endDate } = req.body;
  const userId = req.user.id;
  const authHeader = req.headers.authorization || "";

  // Validate that the userId exists in the user-service
  const userExists = await validateUser(userId, authHeader);
  if (!userExists) {
    res.status(404).json({
      success: false,
      message: `User with ID ${userId} does not exist`,
      data: null,
      error: { code: "USER_NOT_FOUND" },
    });
    return;
  }

  const newMedicinremainder = await Medicinremainder.create({
    userId,
    medicineName,
    dosage,
    days,
    timeSlots,
    startDate,
    endDate,
  });


  

  await publishEvent("medicinremainder_events", "MEDICINREMAINDER_REGISTERED", {
    MedicinremainderId: newMedicinremainder.id,
    userId: newMedicinremainder.userId,
  });


    await axios.post('http://localhost:3008/medicin-task', {
   userId, medicineName, dosage, days, timeSlots, startDate, endDate, 
    message: "This time your medicing time"
   })



  res.status(201).json({
    success: true,
    message: "Medicine reminder registered successfully",
    data: newMedicinremainder,
    error: null,
  });
});


// GET ONE - GET /medicinremainder/:id
export const getanMedicinremainder: any = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const medicinremainder = await Medicinremainder.findOne({
    where: { id: req.params.id, userId },
  });

  if (!medicinremainder) {
    res.status(404).json({
      success: false,
      message: "Medicine reminder not found or unauthorized",
      data: null,
      error: { code: "MEDICINREMAINDER_NOT_FOUND" },
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Medicine reminder fetched successfully",
    data: medicinremainder,
    error: null,
  });
});

// UPDATE - PUT /medicinremainder/:id
export const updateData: any = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updatePayload = req.body;

  // Remove userId from payload to prevent ownership hijacking
  delete updatePayload.userId;

  const medicinremainder = await Medicinremainder.update(updatePayload, {
    where: { id, userId },
    returning: true,
  });

  if (!medicinremainder[1] || medicinremainder[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Medicine reminder not found or unauthorized",
      data: null,
      error: { code: "MEDICINREMAINDER_NOT_FOUND" },
    });
    return;
  }

  await publishEvent("medicinremainder_events", "MEDICINREMAINDER_UPDATED", {
    id: medicinremainder[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "Medicine reminder updated successfully",
    data: medicinremainder[1][0],
    error: null,
  });
});

// DELETE - DELETE /medicinremainder/:id
export const medicinremainderDelete: any = asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;

  const record = await Medicinremainder.findOne({ where: { id, userId } });
  if (!record) {
    res.status(404).json({
      success: false,
      message: "Medicine reminder not found or unauthorized",
      data: null,
      error: { code: "MEDICINREMAINDER_NOT_FOUND" },
    });
    return;
  }

  await Medicinremainder.destroy({ where: { id, userId } });

  res.status(200).json({
    success: true,
    message: "Medicine reminder deleted successfully",
    data: null,
    error: null,
  });
});

// GET ALL - GET /medicinremainder
export const getMedicinremainder: any = asyncHandler(async (req: Request, res: Response) => {
  const medicinremainder = await Medicinremainder.findAll();

  if (medicinremainder.length === 0) {
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
    data: medicinremainder,
    error: null,
  });
});













