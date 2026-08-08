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
        const { notificationId, hospitalId, recipients, subject, message } = content;

        let allEmails: any[] = [];

        if (recipients && Array.isArray(recipients)) {
            for (const recipient of recipients) {
                const { roleId, all, userIds } = recipient;

                if (all) {
                    // Fetch ALL users for this role
                    try {
                        const doctorsRes = await axios.post(
                            `${process.env.DOCTOR_SERVICE_URL || process.env.DOCTOR_SERVICE}/doctor/emails-by-roles`,
                            { roleIds: [roleId], hospitalId }
                        );
                        if (Array.isArray(doctorsRes.data)) {
                            allEmails.push(...doctorsRes.data);
                        }
                    } catch (err) {
                        console.error("Failed to fetch doctor emails by role:", err);
                    }

                    try {
                        const staffRes = await axios.post(
                            `${process.env.STAFF_SERVICE_URL || process.env.STAFF_SERVICE}/staff/emails-by-roles`,
                            { roleIds: [roleId], hospitalId }
                        );
                        if (Array.isArray(staffRes.data)) {
                            allEmails.push(...staffRes.data);
                        }
                    } catch (err) {
                        console.error("Failed to fetch staff emails by role:", err);
                    }
                } else if (userIds && userIds.length > 0) {
                    // Fetch SPECIFIC users for this role
                    try {
                        const doctors = await axios.post(
                            `${process.env.DOCTOR_SERVICE_URL || process.env.DOCTOR_SERVICE}/doctor/emails`,
                            { ids: userIds, roleId, hospitalId }
                        );
                        if (Array.isArray(doctors.data)) {
                            allEmails.push(...doctors.data);
                        }
                    } catch (err) {
                        console.error("Failed to fetch specific doctor emails:", err);
                    }

                    try {
                        const staffs = await axios.post(
                            `${process.env.STAFF_SERVICE_URL || process.env.STAFF_SERVICE}/staff/emails`,
                            { ids: userIds, roleId, hospitalId }
                        );
                        if (Array.isArray(staffs.data)) {
                            allEmails.push(...staffs.data);
                        }
                    } catch (err) {
                        console.error("Failed to fetch specific staff emails:", err);
                    }
                }
            }
        }

        // Deduplicate by email address
        const uniqueEmails = Array.from(
            new Map(allEmails.filter(u => u && u.email).map(u => [u.email, u])).values()
        );

        if (uniqueEmails.length === 0) {
            console.log("No valid emails found to send notification");
            if (notificationId) {
                await EmailNotification.update(
                    { status: "FAILED", failedCount: 0, totalRecipients: 0 },
                    { where: { id: notificationId } }
                );
            }
            return;
        }

        // Update totalRecipients with actual resolved count
        if (notificationId) {
            await EmailNotification.update(
                { totalRecipients: uniqueEmails.length },
                { where: { id: notificationId } }
            );
        }

        const results = await Promise.allSettled(
            uniqueEmails.map(user => {
                return transporter.sendMail({
                    from: process.env.SMTP_USER || "noreply@hosta.com",
                    to: user.email,
                    subject: subject,
                    html: message
                });
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

        console.log(`Successfully processed email notification for ${uniqueEmails.length} recipients. Success: ${successCount}, Failed: ${failedCount}`);
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
