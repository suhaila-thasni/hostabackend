import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleLabEvent = async (routingKey: string, content: any) => {
  let msg = "";

  switch (routingKey) {
    case "LABRESULT_REGISTERED":
      msg = `A new lab result has been added for ${content.patientName || "the patient"}`;
      break;
    case "LABRESULT_UPDATED":
      msg = `Lab result has been updated for ${content.patientName || "the patient"}`;
      break;
    case "LABRESULT_DELETED":
      msg = `Lab result has been removed for ${content.patientName || "the patient"}`;
      break;
    case "LABRESULT_RECOVERED":
      msg = `Lab result has been recovered for ${content.patientName || "the patient"}`;
      break;
    case "TEST_REGISTERED":
      msg = `Test registered: ${content.testName || "Medical Test"}`;
      break;
    case "REPORT_REGISTERED":
    case "REPORT_UPDATED":
      msg = `Medical Report available for ${content.patientName || "the patient"}`;
      break;
    default:
      console.warn(`⚠️ Unhandled lab event: ${routingKey}`);
      return;
  }

  await Notification.create({
    userIds: content.userId ? [content.userId] : [],
    hospitalIds: content.hospitalId ? [content.hospitalId] : [],
    message: msg,
  }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

  if (content.userId) {
    safeSocketEmit(`user_${content.userId}`, "labresult_event", { event: routingKey, message: msg, data: content });
  }

  if (content.hospitalId) {
    safeSocketEmit(`hospital_${content.hospitalId}`, "labresult_event", { event: routingKey, message: msg, data: content });
  }
};
