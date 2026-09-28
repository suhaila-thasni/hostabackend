



import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleLabEvent = async (routingKey: string, content: any) => {
  let msg = "";

  if (routingKey.startsWith("LAB_")) {
    msg = `Lab event updated: ${routingKey}`;
  } else if (routingKey.startsWith("TEST_")) {
    msg = `Test registered: ${content.testName || "Medical Test"}`;
  } else if (routingKey.startsWith("REPORT_")) {
    msg = `Medical Report available for ${content.patientName || "patient"}`;
  } else {
    console.warn(`⚠️ Unhandled lab event: ${routingKey}`);
    return;
  }

  await Notification.create({
    userIds: content.userId ? [content.userId] : [],
    hospitalIds: content.hospitalId ? [content.hospitalId] : [],
    message: msg,
  }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

  if (content.userId) {
    safeSocketEmit(`user_${content.userId}`, "lab_event", { event: routingKey, message: msg, data: content });
  }
  
  if (content.hospitalId) {
    safeSocketEmit(`hospital_${content.hospitalId}`, "lab_event", { event: routingKey, message: msg, data: content });
  }
};
