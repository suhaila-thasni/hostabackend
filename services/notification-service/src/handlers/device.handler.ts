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

  // 1. Save and Emit for SuperAdmin (includes hospitalName)
  await Notification.create({
    superAdminIds: [1],
    message: title,
    metadata: {
      event: routingKey,
      ...content,
    },
  }).catch((err) => console.error(`Failed to save ${routingKey} notification for SuperAdmin`, err));

  safeSocketEmit("role_1", "device_event", {
    event: routingKey,
    message: title,
    data: content,
  });

  // 2. Save and Emit for Hospital (excludes hospitalName since they already know it)
  if (hospitalId) {
    // Create a copy of the content without hospitalName
    const { hospitalName, ...hospitalContent } = content;

    await Notification.create({
      hospitalIds: [hospitalId],
      message: title,
      metadata: {
        event: routingKey,
        ...hospitalContent,
      },
    }).catch((err) => console.error(`Failed to save ${routingKey} notification for Hospital`, err));

    safeSocketEmit(`hospital_${hospitalId}`, "device_event", {
      event: routingKey,
      message: title,
      data: hospitalContent,
    });
  }
};
