import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Rating from "../models/rating.model";
import { publishEvent } from "../events/publisher";
import axios from "axios";


export const Registeration =
asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<void> => {

    const {
      userId,
      hospitalId,
      doctorId,
      rating
    } = req.body;

    /* =========================
       VALIDATE INPUT
    ========================== */

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "userId required"
      });
      return;
    }

    if (!hospitalId && !doctorId) {
      res.status(400).json({
        success: false,
        message:
          "hospitalId or doctorId required"
      });
      return;
    }

    if (!rating) {
      res.status(400).json({
        success: false,
        message: "rating required"
      });
      return;
    }

    /* =========================
       GET BOOKINGS FROM SERVICE
    ========================== */

    const appointmentResponse =
      await axios.get(
        "http://localhost:3001/bookings"
      );

    const bookings =
      appointmentResponse.data;

    /* =========================
       FILTER BOOKINGS
    ========================== */

    let matchedBookings: any[] = [];

    if (hospitalId && doctorId) {

      matchedBookings =
        bookings.filter((val: any) =>
          val.doctorId == doctorId &&
          val.hospitalId == hospitalId
        );

    }
    else if (hospitalId) {

      matchedBookings =
        bookings.filter((val: any) =>
          val.hospitalId == hospitalId
        );

    }

    /* =========================
       CHECK USER BOOKINGS
    ========================== */

    const userBookings =
      matchedBookings.filter(
        (val: any) =>
          val.userId == userId &&
          val.status == "completed"
      );

    if (userBookings.length === 0) {

      res.status(400).json({
        success: false,
        message:
          "You don't have any completed booking"
      });

      return;
    }

    /* =========================
       CREATE RATING
    ========================== */

    const newRating =
      await Rating.create({
        userId,
        hospitalId,
        doctorId,
        rating
      });

    /* =========================
       PUBLISH EVENT
    ========================== */

    await publishEvent(
      "rating_events",
      "RATING_REGISTERED",
      {
        ratingId: newRating.id,
        userId,
        hospitalId,
        doctorId,
        rating
      }
    );

    /* =========================
       SUCCESS RESPONSE
    ========================== */

    res.status(201).json({
      success: true,
      message:
        "Rating created successfully",
      data: newRating,
      error: null
    });

  }
);



// GET ONE - GET /rating/:id
export const getanRating : any = asyncHandler(async (req: Request, res: Response) => {
  const rating = await Rating.findByPk(req.params.id);
  if (!rating) {
    res.status(404).json({
      success: false,
      message: "rating not found",
      data: null,
      error: { code: "RATING_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: rating,
    error: null,
  });
});





// UPDATE - PUT /rating/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const rating = await Rating.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!rating[1] || rating[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "rating not found",
      status: 200,
      data: null,
      error: { code: "RATING_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("rating_events", "RATING_UPDATED", {
    staffId: rating[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: rating[1][0],
    error: null,
  });
});

// DELETE - DELETE /rating/:id
export const ratingDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const rating = await Rating.findByPk(id);
  if (!rating) {
    res.status(404).json({
      success: false,
      message: "rating not found",
      data: null,
      error: { code: "RATING_NOT_FOUND", details: null },
    });
    return;
  }


  await Rating.destroy({
    where: { id: id }
  });


  res.status(200).json({
    success: true,
    message: "Rating deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});

// GET ALL - GET /rating
export const getRating: any = asyncHandler(async (req: Request, res: Response) => {
  const rating = await Rating.findAll();

  if (rating.length === 0) {
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
    data: rating,
    error: null,
  });
});






