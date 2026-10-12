import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";
import { Op } from "sequelize";

// helper: format time for display (IST)
const formatTime = (date: Date | string) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

export const handleAuthEvent = async (routingKey: string, content: any) => {
  if (routingKey !== "AUTH_LOGIN") return;

  const role = content.role || "User";
  const name = content.name || "Someone";
  const authId = content.authId;
  const isSuspicious = content.status === 'Failed' || content.riskLevel === 'High';
  const isHospitalLogin = role.toLowerCase() === 'hospital';
  const hospitalIdsForNotification = (content.hospitalId && !isHospitalLogin) ? [content.hospitalId] : [];
  const superAdminIdsForNotification = isHospitalLogin ? [1] : [];

  if (!authId) return;

  // Time boundaries for "today"
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const eventType = content.status === 'Failed' ? 'failed_login' : (content.riskLevel === 'High' ? 'new_ip_login' : 'routine_login');

  try {
    // 1. Try to find an existing notification for this user today
    const existingNotification = await Notification.findOne({
      where: {
        createdAt: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
        "metadata.authId": authId,
        "metadata.eventType": "routine_login"
      }
    });

    let msg = "";
    const title = "Staff login activity";
    const type = "Activity summary";
    
    const now = new Date();

    let updatedMetadata: any = {
      authId,
      eventType: "routine_login",
      count: 1,
      latestSignInTime: now.toISOString(),
      previousSignInTime: null,
    };

    if (existingNotification) {
      // Grouping: increment count
      const oldMeta: any = existingNotification.metadata || {};
      const currentCount = typeof oldMeta.count === "number" ? oldMeta.count : 1;
      const newCount = currentCount + 1;

      updatedMetadata.count = newCount;
      // the old "latest" becomes the previous login
      updatedMetadata.previousSignInTime = oldMeta.latestSignInTime || null;

      msg = `${role.toUpperCase()} | ${name} has logged in ${newCount} times today. Last login: ${formatTime(now)}`;

      existingNotification.message = msg;
      existingNotification.metadata = updatedMetadata;
      await existingNotification.save();
      
      emitSocket(routingKey, title, type, msg, content, updatedMetadata, hospitalIdsForNotification, isHospitalLogin);
      
    } else {
      // New notification
      msg = `${role.toUpperCase()} | ${name} has logged in 1 time today. Last login: ${formatTime(now)}`;

      await Notification.create({
        userIds: [],
        hospitalIds: hospitalIdsForNotification,
        superAdminIds: superAdminIdsForNotification,
        message: msg,
        metadata: updatedMetadata,
      });

      emitSocket(routingKey, title, type, msg, content, updatedMetadata, hospitalIdsForNotification, isHospitalLogin);
    }
  } catch (error) {
    console.error("Failed to process grouped auth notification", error);
  }
};

function emitSocket(routingKey: string, title: string, type: string, msg: string, content: any, metadata: any, hospitalIdsForNotification: number[], isHospitalLogin: boolean) {
  const payload = {
    event: routingKey,
    title,
    type,
    message: msg,
    data: content,
    metadata
  };

  if (hospitalIdsForNotification.length > 0) {
    safeSocketEmit(`hospital_${hospitalIdsForNotification[0]}`, "auth_event", payload);
  }

  if (isHospitalLogin) {
    safeSocketEmit("super_admin", "auth_event", payload);
  }
};
