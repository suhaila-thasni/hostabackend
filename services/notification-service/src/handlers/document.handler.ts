import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleDocumentEvent = async (routingKey: string, content: any) => {
  const actorName = content.actorName || "Unknown Actor";
  const actorRole = content.actorRole || "Staff";
  const patientName = content.patientName || "Unknown Patient";
  const docName = content.documentName || "Untitled";
  const hospitalIds = content.hospitalId ? [content.hospitalId] : [];

  let title = "";
  let type = "";
  let msg = "";

  if (routingKey === "DOCUMENT_REGISTERED") {
    title = "Patient document added";
    type = "Info";
    msg = `${actorName} added a document to ${patientName}'s patient record.`;
  } else if (routingKey === "DOCUMENT_UPDATED") {
    title = "Patient document updated";
    type = "Info";
    msg = `${actorName} (${actorRole}) updated a document in ${patientName}'s patient record.`;
  } else if (routingKey === "DOCUMENT_DELETED") {
    title = "Patient document deleted";
    type = "Important";
    msg = `${actorRole} ${actorName} deleted a document from ${patientName}'s patient record.`;
  } else {
    console.warn(`⚠️ Unhandled document event: ${routingKey}`);
    return;
  }

  try {
    // 2. Create Notification (Skip for the actor's own dashboard unless required, sending to hospital admins instead)
    await Notification.create({
      userIds: [], 
      hospitalIds: hospitalIds,
      message: msg,
      metadata: {
        title,
        type,
        action: routingKey,
        patientName,
        documentId: content.documentId
      }
    });

    // 3. Emit Socket Events
    const payload = { event: routingKey, title, type, message: msg, data: content };

    if (content.userId) {
      safeSocketEmit(`user_${content.userId}`, "document_event", payload);
    }
    
    if (content.hospitalId) {
      safeSocketEmit(`hospital_${content.hospitalId}`, "document_event", payload);
    }
  } catch (error) {
    console.error(`Failed to process ${routingKey}`, error);
  }
};
