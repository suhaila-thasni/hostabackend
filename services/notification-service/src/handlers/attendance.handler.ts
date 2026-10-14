import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleAttendanceEvent = async (routingKey: string, content: any) => {
  // Check if we are receiving the new structured professional payload
  const isStructured = !!content.title && !!content.message;
  
  // Extract core data (fallback to flat content for older events)
  const payloadData = isStructured ? content.data : content;
  const hospitalId = payloadData?.hospitalId;
  const employeeId = payloadData?.employeeId;

  let title = content.title || "Attendance Update";
  let message = content.message || "";
  let severity = content.severity || "info";
  let recipient = content.recipient || "admin";

  // Fallback for older, non-structured payloads
  if (!isStructured) {
    switch (routingKey) {
      case "ATTENDANCE_REGISTERED": title = "Attendance Registered"; break;
      case "ATTENDANCE_UPDATED": title = "Attendance Updated"; break;
      case "ATTENDANCE_DELETED": title = "Attendance Deleted"; break;
      default:
        console.warn(`⚠️ Unhandled legacy attendance event: ${routingKey}`);
        return;
    }
    const employeeName = payloadData.employeeName || payloadData.staffName || "an employee";
    const deviceIdStr = payloadData.deviceId ? `on device ${payloadData.deviceId}` : "";
    message = `${title}: For ${employeeName} ${deviceIdStr}`.trim();
  }

  const hospitalName = payloadData?.hospitalName || "Unknown Hospital";
  const employeeType = payloadData?.employeeType || "Staff";
  const isManualAction = routingKey === "ATTENDANCE_CREATED_MANUALLY" || routingKey === "ATTENDANCE_UPDATED" || routingKey === "ATTENDANCE_DELETED";
  const isCheckInOut = routingKey === "ATTENDANCE_CHECKED_IN" || routingKey === "ATTENDANCE_CHECKED_OUT";

  // 1. Emit and save for SuperAdmin (includes Hospital Name context)
  // Exclude manual attendance actions (create, edit, delete) and daily check-in/check-out from SuperAdmin
  if (!isManualAction && !isCheckInOut) {
    const superAdminMessage = isStructured ? `${hospitalName} | ${title}: ${message}` : `${hospitalName} | ${message}`;
    
    await Notification.create({
      superAdminIds: [1],
      message: superAdminMessage,
      metadata: {
        event: routingKey,
        severity,
        ...content,
      },
    }).catch((err) => console.error(`Failed to save ${routingKey} notification for SuperAdmin`, err));

    safeSocketEmit("role_1", "attendance_event", {
      event: routingKey,
      title,
      message: superAdminMessage,
      severity,
      data: payloadData,
    });
  }

  // 2. Emit and save for Hospital Admin
  // Exclude manual attendance actions (create, edit, delete): only for staff and doctors
  // Check-in and Check-out (recipient="both") will be sent to Hospital Admin
  if (!isManualAction && hospitalId && (recipient === "admin" || recipient === "both" || !isStructured)) {
    await Notification.create({
      hospitalIds: [hospitalId],
      message,
      metadata: {
        event: routingKey,
        title,
        severity,
        ...content,
      },
    }).catch((err) => console.error(`Failed to save ${routingKey} notification for Hospital`, err));

    safeSocketEmit(`hospital_${hospitalId}`, "attendance_event", {
      event: routingKey,
      title,
      message,
      severity,
      data: payloadData,
    });
  }

  // 3. Emit and save for specific Employee (Staff or Doctor)
  if (hospitalId && employeeId && (recipient === "employee" || recipient === "both" || isManualAction)) {
    const isDoctor = String(employeeType).toLowerCase().includes("doctor");

    const employeeNotificationData: any = {
      message,
      metadata: {
        event: routingKey,
        title,
        severity,
        category: "attendance",
        ...content,
      },
    };

    if (isDoctor) {
      employeeNotificationData.doctorIds = [Number(employeeId)];
    } else {
      employeeNotificationData.staffIds = [Number(employeeId)];
    }

    await Notification.create(employeeNotificationData).catch((err) =>
      console.error(`Failed to save ${routingKey} notification for Employee (${isDoctor ? "Doctor" : "Staff"})`, err)
    );

    const eventPayload = {
      event: routingKey,
      title,
      message,
      severity,
      data: payloadData,
    };

    safeSocketEmit(`employee_${employeeId}`, "attendance_event", eventPayload);
    safeSocketEmit(`user_${employeeId}`, "attendance_event", eventPayload);
    if (isDoctor) {
      safeSocketEmit(`doctor_${employeeId}`, "attendance_event", eventPayload);
    } else {
      safeSocketEmit(`staff_${employeeId}`, "attendance_event", eventPayload);
    }
  }
};
