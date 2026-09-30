import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleLabEvent = async (routingKey: string, content: any) => {
  const actorName = content.actorName || "Unknown Actor";
  const actorRole = content.actorRole || "Staff";
  const patientName = content.patientName || "Unknown Patient";
  const hospitalIds = content.hospitalId ? [content.hospitalId] : [];

  let title = "";
  let type = "";
  let msg = "";

  switch (routingKey) {
    case "LABRESULT_REGISTERED":
      title = "Lab result added";
      type = "Info";
      msg = `${actorName} added a lab result for ${patientName}'s record.`;
      break;
    case "LABRESULT_UPDATED":
      title = "Lab result updated";
      type = "Info";
      msg = `${actorName} (${actorRole}) updated a lab result in ${patientName}'s record.`;
      break;
    case "LABRESULT_DELETED":
      title = "Lab result deleted";
      type = "Important";
      msg = `${actorRole} ${actorName} deleted a lab result from ${patientName}'s record.`;
      break;
    case "LABRESULT_RECOVERED":
      title = "Lab result recovered";
      type = "Info";
      msg = `${actorName} recovered a lab result for ${patientName}'s record.`;
      break;
    case "TEST_REGISTERED":
      title = "Test registered";
      type = "Info";
      msg = `Test registered: ${content.testName || "Medical Test"}`;
      break;
    case "REPORT_REGISTERED":
    case "REPORT_UPDATED":
      title = "Medical Report available";
      type = "Info";
      msg = `Medical Report available for ${content.patientName || "the patient"}`;
      break;
    default:
      console.warn(`⚠️ Unhandled lab event: ${routingKey}`);
      return;
  }

  try {
    // Create Notification (Skip for the actor's own dashboard unless required, sending to hospital admins instead)
    await Notification.create({
      userIds: [], 
      hospitalIds: hospitalIds,
      message: msg,
      metadata: {
        title,
        type,
        action: routingKey,
        patientName,
        labResultId: content.id
      }
    });

    // Emit Socket Events
    const payload = { event: routingKey, title, type, message: msg, data: content };

    if (content.userId) {
      safeSocketEmit(`user_${content.userId}`, "labresult_event", payload);
    }
    
    if (content.hospitalId) {
      safeSocketEmit(`hospital_${content.hospitalId}`, "labresult_event", payload);
    }
  } catch (error) {
    console.error(`Failed to save ${routingKey} notification`, error);
  }
};
