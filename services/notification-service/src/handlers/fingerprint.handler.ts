import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleFingerprintEvent = async (routingKey: string, content: any) => {
  const hospitalId = content.hospitalId;

  let title = "";

  switch (routingKey) {
    case "FINGERPRINT_REGISTERED":
      title = "Fingerprint Registered";
      break;

    case "FINGERPRINT_UPDATED":
      title = "Fingerprint Updated";
      break;

    case "FINGERPRINT_DEACTIVATED":
      title = "Fingerprint Deactivated";
      break;

    case "FINGERPRINT_ACTIVATED":
      title = "Fingerprint Activated";
      break;

    default:
      console.warn(`⚠️ Unhandled fingerprint event: ${routingKey}`);
      return;
  }

  // Create descriptive text for the message body
  const employeeName = content.employeeName || "an employee";
  const deviceIdStr = content.deviceId ? `on device ${content.deviceId}` : "";
  const hospitalName = content.hospitalName || "Unknown Hospital";

  const baseMessage = `${title}: For ${employeeName} ${deviceIdStr}`.trim();

  // 1. Save and Emit for SuperAdmin (includes hospitalName in the message string)
  const superAdminMessage = `${hospitalName} | ${baseMessage}`;
  await Notification.create({
    superAdminIds: [1],
    message: superAdminMessage,
    metadata: {
      event: routingKey,
      ...content,
    },
  }).catch((err) => console.error(`Failed to save ${routingKey} notification for SuperAdmin`, err));

  safeSocketEmit("role_1", "fingerprint_event", {
    event: routingKey,
    message: superAdminMessage,
    data: content,
  });

  // 2. Save and Emit for Hospital (excludes hospitalName from the message string)
  if (hospitalId) {
    // Create a copy of the content without hospitalName
    const { hospitalName: _, ...hospitalContent } = content;

    await Notification.create({
      hospitalIds: [hospitalId],
      message: baseMessage,
      metadata: {
        event: routingKey,
        ...hospitalContent,
      },
    }).catch((err) => console.error(`Failed to save ${routingKey} notification for Hospital`, err));

    safeSocketEmit(`hospital_${hospitalId}`, "fingerprint_event", {
      event: routingKey,
      message: baseMessage,
      data: hospitalContent,
    });
  }
};
