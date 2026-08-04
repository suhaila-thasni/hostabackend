import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

const persistNotification = async (payload: Record<string, any>, errorMessage: string) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error(errorMessage, error);
  }
};

export const handleStaffEvent = async (routingKey: string, content: any) => {
  if (routingKey === "STAFF_REGISTERED") {
    await persistNotification(
      {
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: `New Staff registered: ${content.staffName || "Staff"}. Welcome to the team!`,
      },
      "Failed to save consolidated staff notification"
    );

    if (content.hospitalId) {
      const msg = `New Staff registered: ${content.staffName || "Staff"}`;
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

  if (routingKey === "STAFF_PASSWORD_RESET" || routingKey === "STAFF_PASSWORD_CHANGED") {
    let msgText = "";
    if (routingKey === "STAFF_PASSWORD_RESET") {
      msgText = `Security Alert: ${content.staffName || "Staff"} has successfully reset their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    } else {
      msgText = `Security Update: ${content.staffName || "Staff"} has changed their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    }

    await persistNotification(
      {
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: msgText,
      },
      `Failed to save staff ${routingKey.toLowerCase().replace("_", " ")} notification`
    );

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
      safeSocketEmit(targetRoom, "emergency_alert", { event: routingKey, message: msgText, data: content });
    }

    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msgText, data: content });
  }

  if (routingKey === "STAFF_PASSWORD_CHANGED_BY_ADMIN") {
    const staffMsg = `Your password has been changed by the hospital admin.${content.newPassword ? ` Your new password: ${content.newPassword}` : ""}`;

    await persistNotification(
      {
        staffIds: content.staffId ? [content.staffId] : [],
        message: staffMsg,
      },
      "Failed to save STAFF_PASSWORD_CHANGED_BY_ADMIN notification"
    );

    if (content.staffId) {
      const staffRoom = `staff_${content.staffId}`;
      safeSocketEmit(staffRoom, "staff_event", { event: routingKey, message: staffMsg, data: content });
      safeSocketEmit(staffRoom, "emergency_alert", { event: routingKey, message: staffMsg, data: content });
    }

    if (content.hospitalId) {
      const hospitalMsg = `Password for staff ${content.staffName || "Staff"} has been changed successfully.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: hospitalMsg, data: content });
    }
  }

  if (routingKey === "STAFF_DELETED" || routingKey === "STAFF_RECOVERED") {
    let msgText = "";
    if (routingKey === "STAFF_DELETED") {
      msgText = `Staff profile deleted / moved to blacklist (ID: ${content.staffId})`;
    } else {
      msgText = `Staff profile recovered from blacklist (ID: ${content.staffId})`;
    }

    await persistNotification(
      {
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: msgText,
      },
      `Failed to save staff ${routingKey.toLowerCase().replace("_", " ")} notification`
    );

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
    }

    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msgText, data: content });
  }
};
