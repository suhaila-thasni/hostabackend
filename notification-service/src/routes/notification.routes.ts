import { Router } from "express";
import {
  Registeration,
  getanNotification,
  updateData,
  notificationDelete,
  getNotification,
  getAllReadNotifications,
  getAllUnreadNotifications
 
} from "../controllers/notification.controllers";

const router = Router();




// CRUD

router.post("/notification/register", Registeration);
router.get("/notification", getNotification);
router.get("/notification/:id", getanNotification);
router.put("/notification/:id", updateData);
router.delete("/notification/:id", notificationDelete);
router.get("/notification/unread/:id/:role", getAllUnreadNotifications);
router.get("/notification/read/:id/:role", getAllReadNotifications);


export default router;