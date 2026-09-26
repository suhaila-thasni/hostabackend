import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleDeviceEvent = async (routingKey: string, content: any) => {
  const hospitalId = content.hospitalId;

  let title = "";

  switch (routingKey) {
    case "DEVICE_REGISTERED":
      title = "Device Registered";
      break;

    case "DEVICE_UPDATED":
      title = "Device Updated";
      break;

    case "DEVICE_UNREGISTERED":
      title = "Device Unregistered";
      break;

    case "DEVICE_RESTORED":
      title = "Device Restored";
      break;

    case "DEVICE_DELETED":
      title = "Device Permanently Deleted";
      break;

    case "DEVICE_CREDENTIALS_REGENERATED":
      title = "Device Credentials Regenerated";
      break;

    default:
      console.warn(`⚠️ Unhandled device event: ${routingKey}`);
      return;
  }

  // Save notification for SuperAdmin
  // The 'message' field will act as the title in the UI
  await Notification.create({
    superAdminIds: [1],
    hospitalIds: hospitalId ? [hospitalId] : [],
    message: title,
  }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

  // Real-time notification to SuperAdmin
  safeSocketEmit("role_1", "device_event", {
    event: routingKey,
    message: title,
    data: content,
  });

  // Real-time notification to hospital-specific room
  if (hospitalId) {
    safeSocketEmit(`hospital_${hospitalId}`, "device_event", {
      event: routingKey,
      message: title,
      data: content,
    });
  }
};
