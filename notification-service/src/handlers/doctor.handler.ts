import Notification from "../models/notification.model";
import { socketEmitter } from "../utils/socket.emitter";

export const handleDoctorEvent = async (routingKey: string, content: any) => {
  if (routingKey === "DOCTOR_REGISTERED") {
    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: `New Doctor registered: ${content.doctorName || "Doctor"}. Welcome to the platform!`,
    }).catch((err) => console.error("Failed to save consolidated doctor notification", err));

    if (content.hospitalId) {
      const msg = `New Doctor registered: ${content.doctorName || "Doctor"}`;
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

  // ── Doctor password reset / changed (by doctor) ──
  if (routingKey === "DOCTOR_PASSWORD_RESET" || routingKey === "DOCTOR_PASSWORD_CHANGED") {
    let msgText = "";
    if (routingKey === "DOCTOR_PASSWORD_RESET") {
      msgText = `Security Alert: ${content.doctorName || "Doctor"} has successfully reset their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    } else {
      msgText = `Security Update: ${content.doctorName || "Doctor"} has changed their password.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
    }

    // OPTION A: Notify only the doctor (change to doctorIds)
    await Notification.create({
      doctorIds: content.doctorId ? [content.doctorId] : [],
      message: msgText,
    }).catch((err) => console.error(`Failed to save doctor ${routingKey} notification`, err));

    if (content.doctorId) {
      const doctorRoom = `doctor_${content.doctorId}`;
      socketEmitter.to(doctorRoom).emit("doctor_event", { event: routingKey, message: msgText, data: content });
      socketEmitter.to(doctorRoom).emit("emergency_alert", { event: routingKey, message: msgText, data: content });
    }

    // If you still want hospital to know, uncomment below:
    // if (content.hospitalId) {
    //   const targetRoom = `hospital_${content.hospitalId}`;
    //   socketEmitter.to(targetRoom).emit("hospital_event", { event: routingKey, message: msgText, data: content });
    // }
    // socketEmitter.to("role_1").emit("hospital_event", { event: routingKey, message: msgText, data: content });
  }

  // ── Notify DOCTOR when Hospital Admin changes their password ──
  if (routingKey === "DOCTOR_PASSWORD_CHANGED_BY_ADMIN") {
    const doctorMsg = `Your password has been changed by the hospital admin.${content.newPassword ? ` Your new password: ${content.newPassword}` : ""}`;

    await Notification.create({
      doctorIds: content.doctorId ? [content.doctorId] : [],
      message: doctorMsg,
    }).catch((err) => console.error("Failed to save DOCTOR_PASSWORD_CHANGED_BY_ADMIN notification", err));

    if (content.doctorId) {
      const doctorRoom = `doctor_${content.doctorId}`;
      socketEmitter.to(doctorRoom).emit("doctor_event", { event: routingKey, message: doctorMsg, data: content });
      socketEmitter.to(doctorRoom).emit("emergency_alert", { event: routingKey, message: doctorMsg, data: content });
    }
    // ✅ NO hospital emit here
  }

  // ── Doctor deleted / recovered ──
  if (routingKey === "DOCTOR_DELETED" || routingKey === "DOCTOR_RECOVERED") {
    let msgText = "";
    if (routingKey === "DOCTOR_DELETED") {
      msgText = `Doctor profile deleted / moved to blacklist (ID: ${content.doctorId})`;
    } else {
      msgText = `Doctor profile recovered from blacklist (ID: ${content.doctorId})`;
    }

    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error(`Failed to save doctor ${routingKey} notification`, err));

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      socketEmitter.to(targetRoom).emit("hospital_event", { event: routingKey, message: msgText, data: content });
    }
    socketEmitter.to("role_1").emit("hospital_event", { event: routingKey, message: msgText, data: content });
  }
};
