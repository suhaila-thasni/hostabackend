import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleHolidayEvent = async (routingKey: string, content: any) => {
  const isStructured = !!content.title && !!content.message;
  
  const payloadData = isStructured ? content.data : content;
  const staffIds: number[] = Array.isArray(content.staffIds) ? content.staffIds : [];
  const doctorIds: number[] = Array.isArray(content.doctorIds) ? content.doctorIds : [];

  let title = content.title || "Holiday Update";
  let message = content.message || "";
  let severity = content.severity || "info";

  // 1. Save and emit for all Staff members
  if (staffIds.length > 0) {
    await Notification.create({
      staffIds,
      message,
      metadata: {
        event: routingKey,
        title,
        severity,
        category: "holiday",
      },
    }).catch((err) => console.error(`Failed to save ${routingKey} notification for Staff`, err));

    staffIds.forEach((sid: number) => {
      safeSocketEmit(`user_${sid}`, "holiday_event", {
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
        category: "holiday",
      },
    }).catch((err) => console.error(`Failed to save ${routingKey} notification for Doctors`, err));

    doctorIds.forEach((did: number) => {
      safeSocketEmit(`user_${did}`, "holiday_event", {
        event: routingKey,
        title,
        message,
        severity,
        data: payloadData,
      });
    });
  }
};
