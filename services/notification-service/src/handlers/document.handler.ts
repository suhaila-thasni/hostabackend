import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleDocumentEvent = async (routingKey: string, content: any) => {
  let msg = "";

  if (routingKey === "DOCUMENT_REGISTERED") {
    msg = `A new document has been uploaded for ${content.patientName || "the patient"}`;
  } else if (routingKey === "DOCUMENT_UPDATED") {
    msg = `A document has been updated for ${content.patientName || "the patient"}`;
  } else if (routingKey === "DOCUMENT_DELETED") {
    msg = `A document has been deleted for ${content.patientName || "the patient"}`;
  } else {
    console.warn(`⚠️ Unhandled document event: ${routingKey}`);
    return;
  }

  await Notification.create({
    userIds: content.userId ? [content.userId] : [],
    hospitalIds: content.hospitalId ? [content.hospitalId] : [],
    message: msg,
  }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

  if (content.userId) {
    safeSocketEmit(`user_${content.userId}`, "document_event", { event: routingKey, message: msg, data: content });
  }
  
  if (content.hospitalId) {
    safeSocketEmit(`hospital_${content.hospitalId}`, "document_event", { event: routingKey, message: msg, data: content });
  }
};
