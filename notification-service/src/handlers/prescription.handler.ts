import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handlePrescriptionEvent = async (routingKey: string, content: any) => {
  if (routingKey === "PRESCRIPTION_CREATED" || routingKey === "PRESCRIPTION_UPDATED" || routingKey === "PRESCRIPTION_DELETED") {
    let msg = "";
    if (routingKey === "PRESCRIPTION_CREATED") {
      msg = `A new prescription has been added for your patient profile. (Prescription ID: ${content.prescriptionId})`;
    } else if (routingKey === "PRESCRIPTION_UPDATED") {
      msg = `A prescription on your profile has been updated. (Prescription ID: ${content.prescriptionId})`;
    } else if (routingKey === "PRESCRIPTION_DELETED") {
      msg = `A prescription on your profile has been blacklisted. (Prescription ID: ${content.prescriptionId})`;
    }

    const includeHospital = routingKey !== "PRESCRIPTION_CREATED";

    await Notification.create({
      userIds: content.userId ? [content.userId] : [],
      hospitalIds: (includeHospital && content.hospitalId) ? [content.hospitalId] : [],
      message: msg,
    }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

    if (content.userId) {
      safeSocketEmit(`user_${content.userId}`, "prescription_event", { event: routingKey, message: msg, data: content });
    }
    if (includeHospital && content.hospitalId) {
      safeSocketEmit(`hospital_${content.hospitalId}`, "prescription_event", { event: routingKey, message: msg, data: content });
    }
  }
};
