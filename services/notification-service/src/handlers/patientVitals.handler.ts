import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handlePatientVitalsEvent = async (routingKey: string, content: any) => {
  const actorName = content.actorName || "Unknown Actor";
  const actorRole = content.actorRole || "Staff";
  const patientName = content.patientName || "Unknown Patient";

  let title = "";
  let type = "";
  let msg = "";

  if (routingKey === "PATIENTVITALS_REGISTERED") {
    title = "Patient vitals recorded";
    type = "Info";
    msg = `${actorName} recorded vitals for patient ${patientName}.`;
  } else if (routingKey === "PATIENTVITALS_UPDATED") {
    title = "Patient vitals updated";
    type = "Info";
    msg = `${actorName} (${actorRole}) updated vitals for patient ${patientName}.`;
  } else if (routingKey === "PATIENTVITALS_DELETED") {
    title = "Patient vitals deleted";
    type = "Important";
    msg = `${actorRole} ${actorName} deleted vitals for patient ${patientName}.`;
  } else {
    console.warn(`⚠️ Unhandled patient vitals event: ${routingKey}`);
    return;
  }

  try {
    // Create Notification
    await Notification.create({
      userIds: [],
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msg,
      metadata: {
        title,
        type,
        action: routingKey,
        patientName,
        patientId: content.patientId,
        vitalsId: content.id
      }
    });

    // Emit Socket Events
    const payload = { event: routingKey, title, type, message: msg, data: content };

    if (content.userId) {
      safeSocketEmit(`user_${content.userId}`, "patientvitals_event", payload);
    }

    if (content.hospitalId) {
      safeSocketEmit(`hospital_${content.hospitalId}`, "patientvitals_event", payload);
    }

    // Also emit to patient-specific room if patientId exists
    if (content.patientId) {
      safeSocketEmit(`patient_${content.patientId}`, "patientvitals_event", payload);
    }
  } catch (error) {
    console.error(`Failed to process ${routingKey}`, error);
  }
};
