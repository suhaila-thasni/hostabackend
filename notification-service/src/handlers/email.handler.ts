import { env } from "../config/env";
import axios from "axios";
import nodemailer from "nodemailer";
import EmailNotification from "../models/email.model";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
});

export const handleEmailEvent = async (
    routingKey: string,
    content: any
) => {
    try {
        const { notificationId, doctorIds, staffIds, subject, message } = content;

        let doctorsEmails: any[] = [];
        let staffsEmails: any[] = [];

        if (doctorIds && doctorIds.length > 0) {
            const doctors = await axios.post(
                `${process.env.DOCTOR_SERVICE_URL || process.env.DOCTOR_SERVICE}/doctor/emails`,
                { ids: doctorIds }
            );
            doctorsEmails = doctors.data;
        }

        if (staffIds && staffIds.length > 0) {
            const staffs = await axios.post(
                `${process.env.STAFF_SERVICE_URL || process.env.STAFF_SERVICE}/staff/emails`,
                { ids: staffIds }
            );
            staffsEmails = staffs.data;
        }

        const emails = [
            ...doctorsEmails,
            ...staffsEmails
        ];

        if (emails.length === 0) {
            console.log("No valid emails found to send notification");
            if (notificationId) {
                await EmailNotification.update(
                    { status: "FAILED", failedCount: 0 },
                    { where: { id: notificationId } }
                );
            }
            return;
        }

        const results = await Promise.allSettled(
            emails.map(user => {
                if (user && user.email) {
                    return transporter.sendMail({
                        from: process.env.SMTP_USER || "noreply@hosta.com",
                        to: user.email,
                        subject: subject,
                        html: message
                    });
                }
                return Promise.reject(new Error("Invalid user email"));
            })
        );

        let successCount = 0;
        let failedCount = 0;

        results.forEach(result => {
            if (result.status === "fulfilled") {
                successCount++;
            } else {
                failedCount++;
            }
        });

        if (notificationId) {
            await EmailNotification.update(
                { 
                    status: failedCount > 0 ? (successCount > 0 ? "PARTIAL" : "FAILED") : "SUCCESS",
                    successCount,
                    failedCount
                },
                { where: { id: notificationId } }
            );
        }

        console.log(`Successfully processed email notification for ${emails.length} recipients. Success: ${successCount}, Failed: ${failedCount}`);
    } catch (error) {
        console.error("Error in handleEmailEvent:", error);
        if (content.notificationId) {
            await EmailNotification.update(
                { status: "FAILED" },
                { where: { id: content.notificationId } }
            ).catch(e => console.error("Could not update notification status to FAILED", e));
        }
        throw error;
    }
};
