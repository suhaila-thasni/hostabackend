import EmailNotification from "../models/email.model";
import { publishEvent } from "../events/publisher";

export const sendEmailNotification = async (payload:any) => {

    const {
        hospitalId,
        createdBy,
        doctorIds,
        staffIds,
        subject,
        message
    } = payload;

    const totalRecipients = (doctorIds?.length || 0) + (staffIds?.length || 0);

    const notification = await EmailNotification.create({
        hospitalId,
        createdBy,
        subject,
        message,
        roles: { doctorIds, staffIds },
        totalRecipients,
        status: "QUEUED"
    });

    await publishEvent(
        "email_events",
        "EMAIL_SEND",
        {
            notificationId: (notification as any).id,
            hospitalId,
            doctorIds,
            staffIds,
            subject,
            message
        }
    );

};