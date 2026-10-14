import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleLeaveEvent = async (routingKey: string, content: any) => {
  // Check if we are receiving the new structured professional payload
  const isStructured = !!content.title && !!content.message;
  
  const payloadData = isStructured ? content.data : content;
  const hospitalId = payloadData?.hospitalId;
  const employeeId = payloadData?.employeeId;
  
  // For fan-out events (e.g. predefined leave templates)
  const staffIds: number[] = Array.isArray(content.staffIds) ? content.staffIds : [];
  const doctorIds: number[] = Array.isArray(content.doctorIds) ? content.doctorIds : [];

  let title = content.title || "Leave Update";
  let message = content.message || "";
  let severity = content.severity || "info";
  let recipient = content.recipient || "admin";

  const hospitalName = payloadData?.hospitalName || "Unknown Hospital";

  // If this is a Leave Template event, it behaves differently (like holidays)
  if (routingKey.startsWith("LEAVE_TEMPLATE_")) {
    // 1. Save and emit for all Staff members
    if (staffIds.length > 0) {
      await Notification.create({
        staffIds,
        message,
        metadata: {
          event: routingKey,
          title,
          severity,
          category: "template",
        },
      }).catch((err) => console.error(`Failed to save ${routingKey} notification for Staff`, err));

      staffIds.forEach((sid: number) => {
        safeSocketEmit(`user_${sid}`, "leave_event", {
          event: routingKey,
          title,
          message,
          severity,
          data: payloadData,
        });
      });
    }

    // 2. Save and emit for all Doctors
    if (doctorIds.length > 0) {
      await Notification.create({
        doctorIds,
        message,
        metadata: {
          event: routingKey,
          title,
          severity,
          category: "template",
        },
      }).catch((err) => console.error(`Failed to save ${routingKey} notification for Doctors`, err));

      doctorIds.forEach((did: number) => {
        safeSocketEmit(`user_${did}`, "leave_event", {
          event: routingKey,
          title,
          message,
          severity,
          data: payloadData,
        });
      });
    }
    
    // Stop here for templates so admins/superadmins don't get spammed when they create it themselves
    return;
  }

  // --- BELOW THIS LINE IS FOR STANDARD LEAVE REQUESTS ---

  // 2. Emit and save for Hospital Admin
  if (hospitalId && (recipient === "admin" || recipient === "both" || !isStructured)) {
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

    safeSocketEmit(`hospital_${hospitalId}`, "leave_event", {
      event: routingKey,
      title,
      message,
      severity,
      data: payloadData,
    });
  }

  // 3. Save and emit for specific Employee
  if (hospitalId && employeeId && (recipient === "employee" || recipient === "both")) {
    const employeeType = payloadData?.employeeType; // "Doctor" or "Staff"

    const notificationData: any = {
      message,
      metadata: {
        event: routingKey,
        title,
        severity,
        ...content,
      },
    };

    if (employeeType === "Doctor") {
      notificationData.doctorIds = [employeeId];
    } else {
      // Default to staff if type is Staff or undefined
      notificationData.staffIds = [employeeId];
    }

    await Notification.create(notificationData).catch((err) => 
      console.error(`Failed to save ${routingKey} notification for Employee`, err)
    );

    const eventPayload = {
      event: routingKey,
      title,
      message,
      severity,
      data: payloadData,
    };

    safeSocketEmit(`user_${employeeId}`, "leave_event", eventPayload);
    safeSocketEmit(`employee_${employeeId}`, "leave_event", eventPayload);
    if (employeeType === "Doctor") {
      safeSocketEmit(`doctor_${employeeId}`, "leave_event", eventPayload);
    } else {
      safeSocketEmit(`staff_${employeeId}`, "leave_event", eventPayload);
    }
  }
};

