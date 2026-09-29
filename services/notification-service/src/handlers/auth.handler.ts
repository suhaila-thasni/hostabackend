import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleAuthEvent = async (routingKey: string, content: any) => {
  let msg = "";

  if (routingKey === "AUTH_LOGIN") {
    const role = content.role || "User";
    const name = content.name || "Someone";
    msg = `${role} ${name} has logged in from ${content.ipAddress || 'an unknown location'}.`;
  } else {
    return;
  }

  // Save notification if desired. We'll optionally save it for the hospital if hospitalId is present.
  // Alternatively, just emitting the socket event might be enough if you don't want to clutter the DB.
  // Let's create it in DB for hospital/superAdmin to see.
  await Notification.create({
    userIds: [], // Not sending this to the user themselves usually
    hospitalIds: content.hospitalId ? [content.hospitalId] : [],
    superAdminIds: !content.hospitalId ? [1] : [], // Just an example if you want super admins to see it
    message: msg,
  }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

  // Emit to hospital socket if associated
  if (content.hospitalId) {
    safeSocketEmit(`hospital_${content.hospitalId}`, "auth_event", {
      event: routingKey,
      message: msg,
      data: content,
    });
  }

  // Optional: Emit to super admin
  if (!content.hospitalId && content.role?.toLowerCase() === 'hospital') {
    safeSocketEmit("super_admin", "auth_event", {
      event: routingKey,
      message: msg,
      data: content,
    });
  }
};
