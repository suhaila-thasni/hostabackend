import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";
import { Op } from "sequelize";

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
    
    let updatedMetadata: any = {
      authId,
      eventType: "routine_login",
      count: 1
    };

    if (existingNotification) {
      // Grouping: increment count
      const currentCount = existingNotification.metadata && typeof existingNotification.metadata === 'object' && 'count' in existingNotification.metadata 
        ? (existingNotification.metadata as any).count 
        : 1;
      const newCount = currentCount + 1;
      updatedMetadata.count = newCount;

      msg = `${name} signed in ${newCount} times today.`;

      existingNotification.message = msg;
      existingNotification.metadata = updatedMetadata;
      await existingNotification.save();
      
      emitSocket(routingKey, title, type, msg, content, hospitalIdsForNotification, isHospitalLogin);
      
    } else {
      // New notification
      msg = `${name} signed in 1 time today.`;

      await Notification.create({
        userIds: [],
        hospitalIds: hospitalIdsForNotification,
        superAdminIds: superAdminIdsForNotification,
        message: msg,
        metadata: updatedMetadata,
      });

      emitSocket(routingKey, title, type, msg, content, hospitalIdsForNotification, isHospitalLogin);
    }
  } catch (error) {
    console.error("Failed to process grouped auth notification", error);
  }
};

function emitSocket(routingKey: string, title: string, type: string, msg: string, content: any, hospitalIdsForNotification: number[], isHospitalLogin: boolean) {
  const payload = {
    event: routingKey,
    title,
    type,
    message: msg,
    data: content,
  };

  if (hospitalIdsForNotification.length > 0) {
    safeSocketEmit(`hospital_${hospitalIdsForNotification[0]}`, "auth_event", payload);
  }

  if (isHospitalLogin) {
    safeSocketEmit("super_admin", "auth_event", payload);
  }
};
