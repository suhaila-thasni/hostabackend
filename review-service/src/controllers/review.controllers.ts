import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Review from "../models/review.model";
import { publishEvent } from "../events/publisher";
import axios from "axios";

// REGISTER - POST /review/register

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
      comment
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

    if (!comment) {
      res.status(400).json({
        success: false,
        message: "comment required"
      });
      return;
    }

    /* =========================
       GET BOOKINGS
       (Temporary method)
    ========================== */

    const appointmentResponse =
      await axios.get(
        "http://localhost:3001/api/bookings"
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
       CHECK USER COMPLETED BOOKING
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
          "You don't have any completed booking to review"
      });

      return;
    }

    /* =========================
       CREATE REVIEW
    ========================== */

    const newReview =
      await Review.create({
        userId,
        hospitalId,
        doctorId,
        comment
      });

    /* =========================
       PUBLISH EVENT
    ========================== */

    await publishEvent(
      "review_events",
      "REVIEW_REGISTERED",
      {
        reviewId: newReview.id,
        userId,
        hospitalId,
        doctorId,
        comment
      }
    );

    /* =========================
       RESPONSE
    ========================== */

    res.status(201).json({
      success: true,
      message:
        "Review created successfully",
      data: newReview,
      error: null,
    });

  }
);


// GET ONE - GET /review/:id
export const getanReview : any = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findByPk(req.params.id);
  if (!review) {
    res.status(404).json({
      success: false,
      message: "review not found",
      data: null,
      error: { code: "REVIEW_NOT_FOUND", details: null },
    });
    return;
  }

  res.status(200).json({
    success: true,
    status: "Success",
    data: review,
    error: null,
  });
});





// UPDATE - PUT /review/:id
export const updateData: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const review = await Review.update(updatePayload, {
    where: { id: id },
    returning: true,
  });

  if (!review[1] || review[1].length === 0) {
    res.status(404).json({
      success: false,
      message: "review not found",
      status: 200,
      data: null,
      error: { code: "REVIEW_NOT_FOUND", details: null },
    });
    return;
  }

  await publishEvent("review_events", "REVIEW_UPDATED", {
    staffId: review[1][0].id,
  });

  res.status(200).json({
    success: true,
    message: "successfully updated",
    data: review[1][0],
    error: null,
  });
});

// DELETE - DELETE /review/:id
export const reviewDelete: any = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const review = await Review.findByPk(id);
  if (!review) {
    res.status(404).json({
      success: false,
      message: "review not found",
      data: null,
      error: { code: "REVIEW_NOT_FOUND", details: null },
    });
    return;
  }


  await Review.destroy({
    where: { id: id }
  });


  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    status: 200,
    data: null,
    error: null,
  });
});

// GET ALL - GET /review
export const getReview: any = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findAll();

  if (review.length === 0) {
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
    data: review,
    error: null,
  });
});






