import { Router } from "express";
import {
  Registeration,
  getanBooking,
  updateData,
  bookingDelete,
  getBooking,
 
} from "../controllers/booking.controllers";
import { authenticate, restrictTo } from "../middleware/authenticate";

const router = Router();




// CRUD - Accessible by authenticated Users and Staff
router.post("/booking/register", authenticate, Registeration);
router.get("/booking", authenticate, getBooking);
router.get("/booking/:id", authenticate, getanBooking);
router.put("/booking/:id", authenticate, updateData);
router.delete("/booking/:id", authenticate, bookingDelete);

export default router;