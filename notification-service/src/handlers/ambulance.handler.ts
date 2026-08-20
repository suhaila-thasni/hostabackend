import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleAmbulanceEvent = async (routingKey: string, content: any) => {
  if (routingKey === "AMBULANCE_REGISTERED" || routingKey === "AMBULANCE_UPDATED" || routingKey === "AMBULANCE_DELETED") {
    let msg = "";
    if (routingKey === "AMBULANCE_REGISTERED") {
      msg = `New ambulance service registered: (ID: ${content.ambulanceId}, Phone: ${content.phone || "N/A"})`;
    } else if (routingKey === "AMBULANCE_UPDATED") {
      msg = `Ambulance service profile updated: (ID: ${content.ambulanceId})`;
    } else if (routingKey === "AMBULANCE_DELETED") {
      msg = `Ambulance service deleted: (ID: ${content.ambulanceId})`;
    }

    await Notification.create({
      superAdminIds: [1],
      message: msg,
    }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

    safeSocketEmit("role_1", "ambulance_events", { event: routingKey, message: msg, data: content });
  }
};
