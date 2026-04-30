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
router.post("/booking/register", authenticate, restrictTo("user", "staff"), Registeration);
router.get("/booking", authenticate, restrictTo("user", "staff"), getBooking);
router.get("/booking/:id", authenticate, restrictTo("user", "staff"), getanBooking);
router.put("/booking/:id", authenticate, restrictTo("user", "staff"), updateData);
router.delete("/booking/:id", authenticate, restrictTo("user", "staff"), bookingDelete);

export default router;