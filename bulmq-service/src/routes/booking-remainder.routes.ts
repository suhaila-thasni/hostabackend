import { Router } from "express";
import {
  assignTaskBooking,
} from "../controllers/booking-remainder.controllers";

const router = Router();




// CRUD

router.post(
  "/booking-task",
 assignTaskBooking
);

export default router;