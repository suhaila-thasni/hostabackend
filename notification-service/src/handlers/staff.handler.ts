import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleStaffEvent = async (routingKey: string, content: any) => {
  if (routingKey === "STAFF_REGISTERED") {
    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: `New Staff registered: ${content.staffName || "Staff"}. Welcome to the team!`,
    }).catch((err) => console.error("Failed to save consolidated staff notification", err));

    if (content.hospitalId) {
      const msg = `New Staff registered:  ${content.staffName || "Staff"}`;
      safeSocketEmit(`hospital_${content.hospitalId}`, "hospital_event", {
        event: routingKey,
        message: msg,
        data: content,
      });
      safeSocketEmit(`hospital_${content.hospitalId}`, "emergency_alert", {
        event: routingKey,
        message: msg,
        data: content,
      });
    }
  }

  if (routingKey === "STAFF_PASSWORD_RESET") {
    // const msgText = `Security Alert:  ${content.staffName || "Staff"} has successfully reset their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;


    const msgText = `Security Alert: ${content.staffName || "Staff"}${
  content.email ? ` (${content.email})` : ""
} has successfully reset their password.${
  content.newPassword ? ` New password: ${content.newPassword}` : ""
}`;
    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save staff password reset notification", err));

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
      safeSocketEmit(targetRoom, "emergency_alert", { event: routingKey, message: msgText, data: content });
    }
  }

  if (routingKey === "STAFF_PASSWORD_CHANGED") {
    // const msgText = `Security Update:  ${content.staffName || "Staff"} has changed their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;


    const msgText = `Security Update: Your password has been changed by the hospital admin at ${
      content.hospitalName || "your hospital"
    }.${
      content.newPassword ? ` Your new password: ${content.newPassword}` : ""
    }`; 

    await Notification.create({
      staffIds: content.staffId ? [content.staffId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save staff password changed notification", err));

    if (content.staffId) {
      const staffRoom = `staff_${content.staffId}`;
      safeSocketEmit(staffRoom, "staff_event", { event: routingKey, message: msgText, data: content });
      safeSocketEmit(staffRoom, "emergency_alert", { event: routingKey, message: msgText, data: content });
    }
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
      safeSocketEmit(staffRoom, "staff_event", { event: routingKey, message: staffMsg, data: content });
      safeSocketEmit(staffRoom, "emergency_alert", { event: routingKey, message: staffMsg, data: content });
    }

    // Also notify hospital for confirmation
    if (content.hospitalId) {
      const hospitalMsg = `Password for staff ${content.staffName || "Staff"} has been changed successfully.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
      
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: hospitalMsg, data: content });
    }
  }

  if (routingKey === "STAFF_UPDATED") {
    const msgText = `Staff profile updated: ${content.staffName || "Staff"} (ID: ${content.staffId})`;

    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      staffIds: content.staffId ? [content.staffId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save STAFF_UPDATED notification", err));

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
      safeSocketEmit(targetRoom, "emergency_alert", { event: routingKey, message: msgText, data: content });
    }

    if (content.staffId) {
      const staffRoom = `staff_${content.staffId}`;
      safeSocketEmit(staffRoom, "staff_event", { event: routingKey, message: msgText, data: content });
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
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
    }
    
    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msgText, data: content });
  }
};
