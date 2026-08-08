import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";
import axios from "axios";
import { transporter } from "./email.handler";

const fetchAuthByRole = async (role: string, id: number) => {
  const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:3020";
  try {
    const resp = await axios.get(`${authServiceUrl}/auth/${id}/role/${role}`);
    return resp.data?.data || null;
  } catch (err) {
    console.error(`Failed to fetch auth for ${role} ${id}:`, err.response?.data || err.message);
    return null;
  }
};

export const handleStaffEvent = async (routingKey: string, content: any) => {
  if (routingKey === "STAFF_REGISTERED") {
    const staffName = content.staffName || "Staff";
    const msgText = `New Staff Registered: ${staffName} has been successfully registered with your hospital.`;

    // Save notification for the hospital
    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save STAFF_REGISTERED notification", err));

    // Send real-time notification to the hospital
    if (content.hospitalId) {
      const hospitalRoom = `hospital_${content.hospitalId}`;

      safeSocketEmit(hospitalRoom, "hospital_event", {
        event: routingKey,
        message: msgText,
        data: content,
      });

      safeSocketEmit(hospitalRoom, "emergency_alert", {
        event: routingKey,
        message: msgText,
        data: content,
      });
    }
  }

  if (routingKey === "STAFF_PASSWORD_RESET") {
    // Ensure email is present; fetch from auth-service when missing
    if (!content.email && content.staffId) {
      const auth = await fetchAuthByRole("staff", content.staffId);
      if (auth) content.email = auth.email;
    }

    const msgText = `Security Alert: ${content.staffName || "Staff"}${
      content.email ? ` (${content.email})` : ""
    } has successfully reset their password.${
      content.newPassword ? ` New password: ${content.newPassword}` : ""
    }`;
    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save staff password reset notification", err));

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
      safeSocketEmit(targetRoom, "emergency_alert", { event: routingKey, message: msgText, data: content });
    }
  }

  if (routingKey === "STAFF_PASSWORD_CHANGED") {
    // Ensure hospitalName is present; fetch from auth-service when missing
    if (!content.hospitalName && content.staffId) {
      const auth = await fetchAuthByRole("staff", content.staffId);
      if (auth) content.hospitalName = auth.hospitalName;
    }

    const msgText = `Security Update: Your password has been changed by the hospital admin at ${
      content.hospitalName || "the hospital"
    }.${
      content.newPassword ? ` Your new password: ${content.newPassword}` : ""
    }`;

    await Notification.create({
      staffIds: content.staffId ? [content.staffId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save staff password changed notification", err));

    if (content.staffId) {
      const staffRoom = `staff_${content.staffId}`;
      safeSocketEmit(staffRoom, "staff_event", { event: routingKey, message: msgText, data: content });
      safeSocketEmit(staffRoom, "emergency_alert", { event: routingKey, message: msgText, data: content });
    }
  }

  // ── Notify STAFF when Hospital Admin changes their password ──
  if (routingKey === "STAFF_PASSWORD_CHANGED_BY_ADMIN") {
    const staffMsg = `Your password has been changed by the hospital admin.${content.newPassword ? ` Your new password: ${content.newPassword}` : ""}`;

    await Notification.create({
      staffIds: content.staffId ? [content.staffId] : [],
      message: staffMsg,
    }).catch((err) => console.error("Failed to save STAFF_PASSWORD_CHANGED_BY_ADMIN notification", err));

    // Notify the specific staff via socket
    if (content.staffId) {
      const staffRoom = `staff_${content.staffId}`;
      safeSocketEmit(staffRoom, "staff_event", { event: routingKey, message: staffMsg, data: content });
      safeSocketEmit(staffRoom, "emergency_alert", { event: routingKey, message: staffMsg, data: content });
    }

    // Also notify hospital for confirmation
    if (content.hospitalId) {
      const hospitalMsg = `Password for staff ${content.staffName || "Staff"} has been changed successfully.${content.newPassword ? ` New password: ${content.newPassword}` : ""}`;
      
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: hospitalMsg, data: content });
    }
  }

  if (routingKey === "STAFF_UPDATED") {
    const staffName = content.staffName || "Staff";
    const hospitalName = content.hospitalName || "the hospital";

    // Staff updated their own profile → Notify Hospital
    if (content.updatedByRole === "staff") {
      const msgText = `${staffName} has updated their profile information. Please review the changes if necessary.`;

      await Notification.create({
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: msgText,
      }).catch((err) => console.error("Failed to save staff profile update notification for hospital", err));

      if (content.hospitalId) {
        const hospitalRoom = `hospital_${content.hospitalId}`;
        safeSocketEmit(hospitalRoom, "hospital_event", {
          event: routingKey,
          message: msgText,
          data: content,
        });
        safeSocketEmit(hospitalRoom, "emergency_alert", {
          event: routingKey,
          message: msgText,
          data: content,
        });
      }
    }

    // Hospital/Admin updated staff's profile → Notify Staff
    if (content.updatedByRole === "hospital") {
      const msgText = `Your profile information has been updated by the hospital ${hospitalName} administrator. Please review your profile to ensure the information is accurate.`;

      await Notification.create({
        staffIds: content.staffId ? [content.staffId] : [],
        message: msgText,
      }).catch((err) => console.error("Failed to save staff profile update notification for staff", err));

      if (content.staffId) {
        const staffRoom = `staff_${content.staffId}`;
        safeSocketEmit(staffRoom, "staff_event", {
          event: routingKey,
          message: msgText,
          data: content,
        });
      }
    }
  }

  if (routingKey === "STAFF_DELETED") {
    const staffName = content.staffName || "Staff";

    const msgText = `Staff Profile Removed — ${staffName}'s profile has been removed and moved to the blacklist.`;

    // Save notification for the hospital
    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save STAFF_DELETED notification", err));

    // Send real-time notification to the hospital
    if (content.hospitalId) {
      const hospitalRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(hospitalRoom, "hospital_event", {
        event: routingKey,
        message: msgText,
        data: content,
      });
    }

    // Email notification to the deleted staff
    if (content.email) {
      const emailMessage = `Your staff profile has been removed and moved to the blacklist by the hospital administrator at ${content.hospitalName || "the hospital"}.\n\nPlease contact ${content.hospitalName || "the hospital"} administration for further information.`;
      
      transporter.sendMail({
        from: process.env.SMTP_USER,
        to: content.email,
        subject: "Staff Profile Removed",
        text: emailMessage,
      }).catch(err => console.error("Failed to send STAFF_DELETED email", err));
    }
  }

  if (routingKey === "STAFF_RECOVERED") {
    const msgText = `Staff profile recovered from blacklist (ID: ${content.staffId})`;

    await Notification.create({
      hospitalIds: content.hospitalId ? [content.hospitalId] : [],
      message: msgText,
    }).catch((err) => console.error("Failed to save STAFF_RECOVERED notification", err));

    if (content.hospitalId) {
      const targetRoom = `hospital_${content.hospitalId}`;
      safeSocketEmit(targetRoom, "hospital_event", { event: routingKey, message: msgText, data: content });
    }
    
    safeSocketEmit("role_1", "hospital_event", { event: routingKey, message: msgText, data: content });
  }
};
