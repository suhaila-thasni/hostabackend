import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleDeviceEvent = async (routingKey: string, content: any) => {
  const deviceName = content.deviceName || "Unknown Device";
  const deviceId = content.deviceId || "N/A";
  const hospitalId = content.hospitalId;

  let msg = "";

  switch (routingKey) {
    case "DEVICE_REGISTERED":
      msg = `New device registered: "${deviceName}" (Device ID: ${deviceId}) at location "${content.location || "N/A"}" — Type: ${content.deviceType || "N/A"}`;
      break;

    case "DEVICE_UPDATED":
      msg = `Device updated: "${deviceName}" (Device ID: ${deviceId}) — Status: ${content.status || "N/A"}`;
      break;

    case "DEVICE_UNREGISTERED":
      msg = `Device unregistered: "${deviceName}" (Device ID: ${deviceId}) — Credentials have been revoked.`;
      break;

    case "DEVICE_RESTORED":
      msg = `Device restored: "${deviceName}" (Device ID: ${deviceId}) — New credentials have been generated.`;
      break;

    case "DEVICE_DELETED":
      msg = `Device permanently deleted: "${deviceName}" (Device ID: ${deviceId})`;
      break;

    case "DEVICE_CREDENTIALS_REGENERATED":
      msg = `Device credentials regenerated: "${deviceName}" (Device ID: ${deviceId})`;
      break;

    default:
      console.warn(`⚠️ Unhandled device event: ${routingKey}`);
      return;
  }

  // Save notification for SuperAdmin
  await Notification.create({
    superAdminIds: [1],
    message: msg,
  }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

  // Real-time notification to SuperAdmin
  safeSocketEmit("role_1", "device_event", {
    event: routingKey,
    message: msg,
    data: content,
  });

  // Real-time notification to hospital-specific room (so hospital admins get device updates)
  if (hospitalId) {
    safeSocketEmit(`hospital_${hospitalId}`, "device_event", {
      event: routingKey,
      message: msg,
      data: content,
    });
  }
};
