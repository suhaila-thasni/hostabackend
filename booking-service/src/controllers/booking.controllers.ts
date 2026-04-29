import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Booking from "../models/booking.model";
import { publishEvent } from "../events/publisher";
import { httpClient } from "../utils/httpClient";
import axios from "axios";

// REGISTER - POST /boooking/register
export const Registeration: any = asyncHandler(async (req: any, res: Response) => {
  const {
    patient_dob, patient_name, patient_place, patient_phone,
    userId: bodyUserId, hospitalId, doctorId,
    booking_date, consulting_time, status
  } = req.body;

  const tokenUserId = req.user.id;
  const authHeader = req.headers.authorization;

  // 1. Security Check: userId in body must match token ID
  if (bodyUserId && Number(bodyUserId) !== Number(tokenUserId)) {
    res.status(403).json({
      success: false,
      message: "Security violation: The provided userId does not match your authenticated account.",
      error: { code: "USER_ID_MISMATCH" }
    });
    return;
  }

  const userId = tokenUserId; // Source of truth
  const errors: string[] = [];

  // 2. Cross-Service Validation
  try {
    // 👤 Validate User
    try {
      await httpClient.get(`http://user-service:3002/users/${userId}`, {
        headers: { Authorization: authHeader }
      });
    } catch (err) {
      errors.push(`User ${userId} not found.`);
    }

    // 👨‍⚕️ Validate Doctor
    try {
      await httpClient.get(`http://doctor-service:3007/doctor/${doctorId}`, {
        headers: { Authorization: authHeader }
      });
    } catch (err) {
      errors.push(`Doctor ${doctorId} not found.`);
    }

    // 🏥 Validate Hospital
    try {
      await httpClient.get(`http://hospital-service:3009/hospital/${hospitalId}`, {
        headers: { Authorization: authHeader }
      });
    } catch (err) {
      errors.push(`Hospital ${hospitalId} not found.`);
    }

    if (errors.length > 0) {
      res.status(404).json({
        success: false,
        message: "Validation failed for one or more entities.",
        errors,
        error: { code: "ENTITY_NOT_FOUND" }
      });
      return;
    }

  } catch (globalErr: any) {
    console.error("Booking validation error:", globalErr.message);
  }

  const newbooking = await Booking.create({
    patient_dob, patient_name, patient_place, patient_phone,
    userId, hospitalId, doctorId,
    booking_date, consulting_time, status
  });

  await publishEvent("booking_events", "BOOKING_REGISTERED", {
    bookingId: newbooking.id,
  });



  res.status(201).json({
    success: true,
    message: "Registeration completed successfully",
    data: newbooking,
    error: null,
  });
});



// GET ONE - GET /booking/:id
export const getanBooking: any = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) {
    res.status(404).json({
      success: false,
      message: "booking not found",
      data: null,
      error: { code: "BOOKING_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: booking,
    error: null,
  });
});

// UPDATE - PUT /booking/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const booking = await Booking.update(updatePayload, {
    where: { id: id },
    returning: true,
  });


  if (!booking[1] || booking[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "booking not found",
      status: 200,
      data: null,
      error: { code: "BOOKING_NOT_FOUND", details: null },
    });
    return;
  }

  // ✅ Get updated booking object
  const updatedBooking = booking[1][0];

  await publishEvent("booking_events", "BOOKING_UPDATED", {
    bookingId: updatedBooking.id,
  });

  // ✅ Use correct values
  await axios.post('http://localhost:3008/booking-task', {
    patient_phone: updatedBooking.patient_phone,
    doctorId: updatedBooking.doctorId,
    status: updatedBooking.status,
    consulting_time: updatedBooking.consulting_time,
    message: `Booking ${updatedBooking.status}`
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: updatedBooking,
    error: null,
  });
});

// DELETE - DELETE /booking/:id
export const bookingDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const staff = await Booking.findByPk(id);
  if (!staff) {
    res.status(404).json({
      success: false,
      message: "booking not found",
      data: null,
      error: { code: "BOOKING_NOT_FOUND", details: null },
    });
    return;
  }


  await Booking.destroy({
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

// GET ALL - GET /booking
export const getBooking: any = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findAll();

  if (booking.length === 0) {
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
    data: booking,
    error: null,
  });
});


