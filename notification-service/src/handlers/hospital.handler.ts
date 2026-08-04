import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

export const handleHospitalEvent = async (routingKey: string, content: any) => {
  if (routingKey === "HOSPITAL_REGISTERED") {
    const msg = `New hospital registered: "${content.hospitalName || "Unknown"}" (ID: ${content.hospitalId})`;
    await Notification.create({
      superAdminIds: [1],
      message: msg,
    }).catch((err) => console.error("Failed to save HOSPITAL_REGISTERED notification", err));

    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msg, data: content });
  }

  if (routingKey === "HOSPITAL_UPDATED") {
    const superMsg = `Hospital updated: "${content.hospitalName || "Unknown"}" (ID: ${content.hospitalId})`;
    const staffDoctorMsg = `Your hospital "${content.hospitalName || "Hospital"}" profile has been updated.`;

    // Save one notification record targeting superadmin, staff, and doctors
    await Notification.create({
      superAdminIds: [1],
      staffIds: Array.isArray(content.staffIds) && content.staffIds.length > 0 ? content.staffIds : [],
      doctorIds: Array.isArray(content.doctorIds) && content.doctorIds.length > 0 ? content.doctorIds : [],
      message: superMsg,
    }).catch((err) => console.error("Failed to save HOSPITAL_UPDATED notification", err));

    // Socket: superadmin
    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: superMsg, data: content });

    // Socket: each staff member
    if (Array.isArray(content.staffIds)) {
      content.staffIds.forEach((sid: number) => {
        safeSocketEmit(`user_${sid}`, "hospital_event", { event: routingKey, message: staffDoctorMsg, data: content });
      });
    }

    // Socket: each doctor
    if (Array.isArray(content.doctorIds)) {
      content.doctorIds.forEach((did: number) => {
        safeSocketEmit(`user_${did}`, "hospital_event", { event: routingKey, message: staffDoctorMsg, data: content });
      });
    }
  }

  if (routingKey === "HOSPITAL_DELETED" || routingKey === "HOSPITAL_BLACKLISTED" || routingKey === "HOSPITAL_RECOVERED") {
    let msg = "";
    if (routingKey === "HOSPITAL_BLACKLISTED") {
      msg = `Hospital moved to blacklist (ID: ${content.hospitalId})`;
    } else if (routingKey === "HOSPITAL_RECOVERED") {
      msg = `Hospital recovered from blacklist (ID: ${content.hospitalId})`;
    } else {
      msg = `Hospital permanently deleted (ID: ${content.hospitalId})`;
    }

    await Notification.create({
      superAdminIds: [1],
      message: msg,
    }).catch((err) => console.error(`Failed to save ${routingKey} notification`, err));

    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msg, data: content });
  }
};
