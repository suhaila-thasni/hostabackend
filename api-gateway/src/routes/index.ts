import express from "express";
import ambulanceRoutes from "./ambulance.routes";
import userRoutes from "./user.routes";
import bloodRoutes from "./blood.routes";
import bloodBankRoutes from "./bloodBank.routes";
import pharmacyRoutes from "./pharmacy.routes";
import staffRoutes from "./staff.routes";
import doctorRoutes from "./doctor.routes";
import specialityRoutes from "./speciality.routes";
import hospitalRoutes from "./hospital.routes";
import bookingRoutes from "./booking.routes";
import medicineReminderRoutes from "./medicinereminder.routes";
import notificationRoutes from "./notification.routes";
import reviewRatingRoutes from "./review.routes"; 
import labRoutes from "./lab.routes";
import adsRoutes from "./ads.routes";
import roleRoutes from "./role.routes"; 

const router = express.Router();

// 🚀 PRODUCTION READY: Versioned API Routes
router.use("/api/v1", [
  bloodRoutes,
  bloodBankRoutes,
  ambulanceRoutes,
  userRoutes,
  pharmacyRoutes,
  staffRoutes,
  doctorRoutes,
  specialityRoutes,
  hospitalRoutes,
  bookingRoutes,
  medicineReminderRoutes,
  notificationRoutes,
  reviewRatingRoutes,
  labRoutes,
  adsRoutes,
  roleRoutes
]);

export default router;
