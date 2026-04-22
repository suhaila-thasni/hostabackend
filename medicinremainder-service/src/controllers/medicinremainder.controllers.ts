import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Medicinremainder from "../models/medicinremainder.model";
import { publishEvent } from "../events/publisher";
import axios from "axios";


// REGISTER - POST /medicinremainder/register
export const Registeration: any = asyncHandler(async (req: Request, res: Response) => {
  
  const { patientId, medicineName, dosage, days, timeSlots, startDate, endDate } = req.body;

  

  const newMedicinremainder = await Medicinremainder.create({
   patientId,
   medicineName,
   dosage,
   days,
   timeSlots,
   startDate,
   endDate
  });

  

  await publishEvent("medicinremainder_events", "MEDICINREMAINDER_REGISTERED", {
    MedicinremainderId: newMedicinremainder.id,
    // phone: newStaff.phone,
  });


    await axios.post('http://localhost:3008/medicin-task', {
   patientId, medicineName, dosage, days, timeSlots, startDate, endDate, 
    message: "This time your medicing time"
   })



  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: null,
    error: null,
  });
});



// GET ONE - GET /medicinremainder/:id
export const getanMedicinremainder : any = asyncHandler(async (req: Request, res: Response) => {
  const medicinremainder = await Medicinremainder.findByPk(req.params.id);
  if (!medicinremainder) {
    res.status(404).json({
      success: false,
      message: "Medicinremainder not found",
      data: null,
      error: { code: "MEDICINREMAINDER_NOT_FOUND", details: null },
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

// UPDATE - PUT /medicinremainder/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const medicinremainder = await Medicinremainder.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!medicinremainder[1] || medicinremainder[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "Medicinremainder not found",
      status: 200,
      data: null,
      error: { code: "MEDICINREMAINDER_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("medicinremainder_events", "MEDICINREMAINDER_UPDATED", {
    staffId: medicinremainder[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: medicinremainder[1][0],
    error: null,
  });
});

// DELETE - DELETE /medicinremainder/:id
export const medicinremainderDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const staff = await Medicinremainder.findByPk(id);
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "Medicinremainder not found",
      data: null,
      error: { code: "MEDICINREMAINDER_NOT_FOUND", details: null },
    });
    return;
  }


  await Medicinremainder.destroy({
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













