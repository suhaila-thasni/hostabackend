import Notification from "../models/notification.model";
import { socketEmitter } from "../utils/socket.emitter";

export const handleStaffEvent = async (routingKey: string, content: any) => {
  if (routingKey === "STAFF_REGISTERED") {
    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: `New Staff registered: ${content.staffName || "Staff"}. Welcome to the team!`,
    }).catch((err) => console.error("Failed to save consolidated staff notification", err));

    if (content.hospitalId) {
      const msg = `New Staff registered:  ${content.staffName || "Staff"}`;
      socketEmitter.to(`hospital_${content.hospitalId}`).emit("hospital_event", {
        event: routingKey,
        message: msg,
        data: content,
      });
      socketEmitter.to(`hospital_${content.hospitalId}`).emit("emergency_alert", {
        event: routingKey,
        message: msg,
        data: content,
      });
    }
  }

  if (routingKey === "STAFF_PASSWORD_RESET" || routingKey === "STAFF_PASSWORD_CHANGED") {
    let msgText = "";
    if (routingKey === "STAFF_PASSWORD_RESET") {
      msgText = `Security Alert:  ${content.staffName || "Staff"} has successfully reset their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    } else {
      msgText = `Security Update:  ${content.staffName || "Staff"} has changed their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    }

    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error(`Failed to save staff ${routingKey.toLowerCase().replace("_", " ")} notification`, err));

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      socketEmitter.to(targetRoom).emit("hospital_event", { event: routingKey, message: msgText, data: content });
      socketEmitter.to(targetRoom).emit("emergency_alert", { event: routingKey, message: msgText, data: content });
    }

    // 2. Also Notify SuperAdmin for security oversight
    socketEmitter.to("role_1").emit("hospital_event", { event: routingKey, message: msgText, data: content });
  }

  // ── Notify STAFF when Hospital Admin changes their password ──
  if (routingKey === "STAFF_PASSWORD_CHANGED_BY_ADMIN") {
    const staffMsg = `Your password has been changed by the hospital admin.${content.newPassword ? ` Your new password: ${content.newPassword}` : ""}`;

    await Notification.create({
      staffIds: content.staffId ? [content.staffId] : [],
      message: staffMsg,
    }).catch((err) => console.error("Failed to save STAFF_PASSWORD_CHANGED_BY_ADMIN notification", err));

    // Notify the specific staff via socket
    if (content.staffId) {
      const staffRoom = `staff_${content.staffId}`;
      socketEmitter.to(staffRoom).emit("staff_event", { event: routingKey, message: staffMsg, data: content });
      socketEmitter.to(staffRoom).emit("emergency_alert", { event: routingKey, message: staffMsg, data: content });
    }

    // Also notify hospital for confirmation
    if (content.hospitalId) {
      const hospitalMsg = `Password for staff ${content.staffName || "Staff"} has been changed successfully.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
      
      const targetRoom = `hospital_${content.hospitalId}`;
      socketEmitter.to(targetRoom).emit("hospital_event", { event: routingKey, message: hospitalMsg, data: content });
    }
  }

  if (routingKey === "STAFF_DELETED" || routingKey === "STAFF_RECOVERED") {
    let msgText = "";
    if (routingKey === "STAFF_DELETED") {
      msgText = `Staff profile deleted / moved to blacklist (ID: ${content.staffId})`;
    } else {
      msgText = `Staff profile recovered from blacklist (ID: ${content.staffId})`;
    }

    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error(`Failed to save staff ${routingKey.toLowerCase().replace("_", " ")} notification`, err));

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      socketEmitter.to(targetRoom).emit("hospital_event", { event: routingKey, message: msgText, data: content });
    }
    
    socketEmitter.to("role_1").emit("hospital_event", { event: routingKey, message: msgText, data: content });
  }
};
