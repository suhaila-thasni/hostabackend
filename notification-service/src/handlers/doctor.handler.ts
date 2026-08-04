import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

const persistNotification = async (payload: Record<string, any>, errorMessage: string) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error(errorMessage, error);
  }
};

export const handleDoctorEvent = async (routingKey: string, content: any) => {
  if (routingKey === "DOCTOR_REGISTERED") {
    await persistNotification(
      {
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: `New Doctor registered: ${content.doctorName || "Doctor"}. Welcome to the platform!`,
      },
      "Failed to save consolidated doctor notification"
    );

    if (content.hospitalId) {
      const msg = `New Doctor registered: ${content.doctorName || "Doctor"}`;
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

  if (routingKey === "DOCTOR_PASSWORD_RESET" || routingKey === "DOCTOR_PASSWORD_CHANGED") {
    let msgText = "";
    if (routingKey === "DOCTOR_PASSWORD_RESET") {
      msgText = `Security Alert: ${content.doctorName || "Doctor"} has successfully reset their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    } else {
      msgText = `Security Update: ${content.doctorName || "Doctor"} has changed their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    }

    await persistNotification(
      {
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: msgText,
      },
      `Failed to save doctor ${routingKey.toLowerCase().replace("_", " ")} notification`
    );

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
      safeSocketEmit(targetRoom, "emergency_alert", { event: routingKey, message: msgText, data: content });
    }

    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msgText, data: content });
  }

  if (routingKey === "DOCTOR_PASSWORD_CHANGED_BY_ADMIN") {
    const doctorMsg = `Your password has been changed by the hospital admin.${content.newPassword ? ` Your new password: ${content.newPassword}` : ""}`;

    await persistNotification(
      {
        doctorIds: content.doctorId ? [content.doctorId] : [],
        message: doctorMsg,
      },
      "Failed to save DOCTOR_PASSWORD_CHANGED_BY_ADMIN notification"
    );

    if (content.doctorId) {
      const doctorRoom = `doctor_${content.doctorId}`;
      safeSocketEmit(doctorRoom, "doctor_event", { event: routingKey, message: doctorMsg, data: content });
      safeSocketEmit(doctorRoom, "emergency_alert", { event: routingKey, message: doctorMsg, data: content });
    }
  }

  

  if (routingKey === "DOCTOR_DELETED" || routingKey === "DOCTOR_RECOVERED") {
    let msgText = "";
    if (routingKey === "DOCTOR_DELETED") {
      msgText = `Doctor profile deleted / moved to blacklist (ID: ${content.doctorId})`;
    } else {
      msgText = `Doctor profile recovered from blacklist (ID: ${content.doctorId})`;
    }

    await persistNotification(
      {
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: msgText,
      },
      `Failed to save doctor ${routingKey.toLowerCase().replace("_", " ")} notification`
    );

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
    }

    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msgText, data: content });
  }
};
