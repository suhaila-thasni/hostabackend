import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleAttendanceEvent = async (routingKey: string, content: any) => {
  const hospitalId = content.hospitalId;

  let title = "";

  switch (routingKey) {
    case "ATTENDANCE_REGISTERED":
      title = "Attendance Registered";
      break;

    case "ATTENDANCE_UPDATED":
      title = "Attendance Updated";
      break;

    case "ATTENDANCE_DELETED":
      title = "Attendance Deleted";
      break;

    

    default:
      console.warn(`⚠️ Unhandled attendance event: ${routingKey}`);
      return;
  }

  // Create descriptive text for the message body
  const employeeName = content.employeeName || content.staffName || "an employee";
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

  safeSocketEmit("role_1", "attendance_event", {
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

    safeSocketEmit(`hospital_${hospitalId}`, "attendance_event", {
      event: routingKey,
      message: baseMessage,
      data: hospitalContent,
    });
  }
};
