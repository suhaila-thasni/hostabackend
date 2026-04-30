import { Router } from "express";
import {
  Registeration,
  getanBooking,
  updateData,
  bookingDelete,
  getBooking,
 
} from "../controllers/booking.controllers";
import { authenticate } from "../middleware/authenticate";
import { checkPermission } from "../middleware/role.middleware";



const router = Router();





// CRUD - Accessible by authenticated Users and Staff
router.post("/booking", authenticate, checkPermission("booking", "create" ), Registeration);
router.get("/booking", authenticate, checkPermission("booking", "view" ), getBooking);
router.get("/booking/:id", authenticate, checkPermission("booking", "view" ), getanBooking);
router.put("/booking/:id", authenticate, checkPermission("booking", "edit" ), updateData);
router.delete("/booking/:id", authenticate, checkPermission("booking", "delete" ), bookingDelete);

export default router;