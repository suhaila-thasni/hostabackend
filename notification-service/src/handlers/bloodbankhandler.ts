import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleBloodBankEvent = async (routingKey: string, content: any) => {
  if (routingKey === "STOCK_CREATED" || routingKey === "STOCK_UPDATED" || routingKey === "STOCK_DELETED") {
    let msg = "";
    if (routingKey === "STOCK_CREATED") {
      msg = `New blood stock added: (Hospital ID: ${content.hospitalId}, Blood Group: ${content.bloodGroup})`;
    } else if (routingKey === "STOCK_UPDATED") {
      msg = `Blood stock updated: (Hospital ID: ${content.hospitalId}, Blood Group: ${content.bloodGroup})`;
    } else if (routingKey === "STOCK_DELETED") {
      msg = `Blood stock deleted: (Hospital ID: ${content.hospitalId})`;
    }

    await Notification.create({
      superAdminIds: [1],
      message: msg,
    }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

    safeSocketEmit("role_1", "blood_bank_events", { event: routingKey, message: msg, data: content });
  }

  if (routingKey === "STOCK_UPDATED" || routingKey === "STOCK_CREATED" || routingKey === "STOCK_DELETED") {
    if (content.hospitalId) {
      safeSocketEmit(`user_${content.hospitalId}`, "blood_stock_alert", {
        message: `Blood Stock Alert: ${content.bloodGroup} inventory is now ${content.count} units.`,
        data: content,
      });
    }
  }
};
