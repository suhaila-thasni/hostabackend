import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";
import axios from "axios";
import { sendPushNotificationMulticast } from "../utils/sendPush";
import { getTokensIfEnabled } from "../utils/token.util";

const formatBookingId = (id: number | string): string => {
  const num = typeof id === "string" ? parseInt(id, 10) : id;
  if (isNaN(num)) return "#APT000000";
  return `#APT${String(num).padStart(6, "0")}`;
};

const persistNotification = async (payload: Record<string, any>, errorMessage: string) => {
  try {
    await Notification.create(payload);
  } catch (error) {
    console.error(errorMessage, error);
  }
};

export const handleBookingEvent = async (routingKey: string, content: any) => {
  if (routingKey === "BOOKING_REGISTERED" || routingKey === "BOOKING_CANCELLED") {
    const formattedId = formatBookingId(content.bookingId);
    const msgText = routingKey === "BOOKING_REGISTERED"
      ? `New booking for ${content.doctorName || "Doctor"} at ${content.hospitalName || "Hospital"} on ${content.booking_date || "the requested date"}`
      : `Booking cancelled for ${content.doctorName || "Doctor"} at ${content.hospitalName || "Hospital"} on ${content.booking_date || "the requested date"} (ID: ${formattedId})`;

    await persistNotification(
      {
        // userIds: content.userId ? [content.userId] : [],
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        doctorIds: content.doctorId ? [content.doctorId] : [],
        message: msgText,
      },
      `Failed to save ${routingKey} notification`
    );

    if (content.userId) {
      safeSocketEmit(`user_${content.userId}`, "booking_event", { event: routingKey, message: msgText, data: content });
    }
    if (content.hospitalId) {
      safeSocketEmit(`hospital_${content.hospitalId}`, "booking_event", { event: routingKey, message: msgText, data: content });
    }

    if (routingKey === "BOOKING_REGISTERED") {
      if (content.doctorId) {
        safeSocketEmit(`user_${content.doctorId}`, "booking_alert", {
          message: `New booking registered: ${content.patient_name || "Patient"} (ID: ${formattedId})`,
          data: content,
        });
      }
      if (content.hospitalId) {
        safeSocketEmit(`user_${content.hospitalId}`, "booking_alert", {
          message: `New booking registered: ${content.patient_name || "Patient"} (ID: ${formattedId})`,
          data: content,
        });
      }
    } else {
      if (content.doctorId) {
        safeSocketEmit(`user_${content.doctorId}`, "booking_alert", {
          message: `Booking cancelled: ${content.patient_name || "Patient"} (ID: ${formattedId})`,
          data: content,
        });
      }
      if (content.hospitalId) {
        safeSocketEmit(`user_${content.hospitalId}`, "booking_alert", {
          message: `Booking cancelled: ${content.patient_name || "Patient"} (ID: ${formattedId})`,
          data: content,
        });
      }
    }

    try {
      const tokensToNotify: string[] = [];
      let pushTitle = "";
      let pushBody = "";

      if (routingKey === "BOOKING_REGISTERED") {
        pushTitle = "New Booking";
        pushBody = `${content.patient_name || "Patient"} booked with ${content.doctorName || "Doctor"}`;

        if (content.hospitalId) {
          const hTokens = await getTokensIfEnabled("hospital", content.hospitalId, "hospital_fcmtoken");
          tokensToNotify.push(...hTokens);
        }
        if (content.doctorId) {
          const dTokens = await getTokensIfEnabled("doctor", content.doctorId, "doctor_fcmtoken");
          tokensToNotify.push(...dTokens);
        }
      } else if (routingKey === "BOOKING_CANCELLED") {
        pushTitle = "Appointment Cancelled";
        pushBody = "Patient cancelled appointment";

        if (content.doctorId) {
          const dTokens = await getTokensIfEnabled("doctor", content.doctorId, "doctor_fcmtoken");
          tokensToNotify.push(...dTokens);
        }
      }

      if (tokensToNotify.length > 0) {
        await sendPushNotificationMulticast({
          tokens: tokensToNotify,
          title: pushTitle,
          body: pushBody,
        });
      }
    } catch (err: any) {
      console.error(`Failed to send ${routingKey} push notification`, err.message);
    }
  }

  if (routingKey === "BOOKING_UPDATED" || routingKey === "BOOKING_ACCEPTED" || routingKey === "BOOKING_COMPLETED") {
    const formattedId = formatBookingId(content.bookingId);
    let msg = "";
    if (content.status === "accepted" || content.status === "declined") {
      msg = `Booking ${formattedId} has been ${content.status} by hospital`;
    } else if (content.status === "completed") {
      msg = `Booking ${formattedId} has been marked as completed`;
    } else {
      msg = `Booking ${formattedId} status has been updated to ${content.status || "updated"}`;  
    }

    await persistNotification(
      {
        userIds: [],
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: msg,
      },
      "Failed to save booking update notification"
    );

    if (content.hospitalId) {
      safeSocketEmit(`hospital_${content.hospitalId}`, "booking_event", {
        event: routingKey,
        message: msg,
        data: content,
      });

      safeSocketEmit(`hospital_${content.hospitalId}`, "booking_created", {
        message: msg,
        bookingId: content.bookingId,
        status: content.status,
      });
    }

    try {
      const tokensToNotify: string[] = [];
      let pushTitle = "";
      let pushBody = "";

      if (content.userId) {
        const authUserToken = await axios.get(`${process.env.USER_SERVICE_URL}/internal/users/${content.userId}`);
        const uTokens = authUserToken?.data?.data?.fcmToken?.map((d: any) => d.fcmToken) ?? [];
        tokensToNotify.push(...uTokens);
      }

      if (routingKey === "BOOKING_ACCEPTED") {
        pushTitle = "Booking Confirmed";
        pushBody = `Appointment with ${content.doctorName || "Doctor"} confirmed`;
      } else if (routingKey === "BOOKING_UPDATED") {
        if (content.status === "declined") {
          pushTitle = "Booking Rejected";
          pushBody = "Your booking has been rejected";
        } else {
          pushTitle = "Booking Updated";
          pushBody = msg;
        }
      } else if (routingKey === "BOOKING_COMPLETED") {
        pushTitle = "Booking Completed";
        pushBody = "Your booking has been completed";
      }

      if (tokensToNotify.length > 0) {
        await sendPushNotificationMulticast({
          tokens: tokensToNotify,
          title: pushTitle,
          body: pushBody,
        });
      }
    } catch (err: any) {
      console.error(`Failed to send ${routingKey} push notification`, err.message);
    }
  }

  // ✅ Token Change Notification
  if (routingKey === "TOKEN_UPDATED") {
    const formattedId = formatBookingId(content.bookingId);
    const msg = `Appointment Update: Your token number for appointment ${formattedId} has been changed from Token #${content.oldToken ?? "N/A"} to Token #${content.newToken ?? "N/A"}. Please take note of your updated token number.`;

    // Save notification for the user
    await persistNotification(
      {
        userIds: content.userId ? [content.userId] : [],
        hospitalIds: content.hospitalId ? [content.hospitalId] : [],
        message: msg,
      },
      "Failed to save TOKEN_UPDATED notification"
    );

    // Real-time socket notification to the user
    if (content.userId) {
      safeSocketEmit(`user_${content.userId}`, "booking_event", {
        event: routingKey,
        message: msg,
        data: content,
      });
    }

    // Push notification to the user
    try {
      if (content.userId) {
        const authUserToken = await axios.get(`${process.env.USER_SERVICE_URL}/internal/users/${content.userId}`);
        const uTokens = authUserToken?.data?.data?.fcmToken?.map((d: any) => d.fcmToken) ?? [];

        if (uTokens.length > 0) {
          await sendPushNotificationMulticast({
            tokens: uTokens,
            title: "Token Number Updated",
            body: `Your token has been changed from #${content.oldToken ?? "N/A"} to #${content.newToken ?? "N/A"} for appointment ${formattedId}.`,
          });
        }
      }
    } catch (err: any) {
      console.error("Failed to send TOKEN_UPDATED push notification", err.message);
    }
  }
};