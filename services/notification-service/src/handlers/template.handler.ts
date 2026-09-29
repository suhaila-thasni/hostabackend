import Notification from "../models/notification.model";
import { safeSocketEmit } from "../utils/socket.emitter";

const persistNotification = async (payload: Record<string, any>, errorMessage: string) => {
    try {
        await Notification.create(payload);
    } catch (error) {
        console.error(errorMessage, error);
    }
};

export const handleTemplateEvent = async (routingKey: string, content: any) => {
    const templateName = content.templateName || "Untitled Template";
    const hospitalId = content.hospitalId;
    const createdBy = content.createdBy;

    // ==============================
    // TEMPLATE_CREATED
    // ==============================
    if (routingKey === "TEMPLATE_CREATED") {
        const msg = `A new email template "${templateName}" has been created`;

        await persistNotification(
            {
                hospitalIds: hospitalId ? [hospitalId] : [],
                staffIds: createdBy ? [createdBy] : [],
                message: msg,
                metadata: {
                    type: "TEMPLATE",
                    event: routingKey,
                    templateId: content.templateId,
                    templateName,
                    category: content.category,
                },
            },
            "Failed to save TEMPLATE_CREATED notification"
        );

        // Notify the hospital dashboard
        if (hospitalId) {
            safeSocketEmit(`hospital_${hospitalId}`, "template_event", {
                event: routingKey,
                message: msg,
                data: content,
            });
        }

        // Notify the creator
        if (createdBy) {
            safeSocketEmit(`staff_${createdBy}`, "template_event", {
                event: routingKey,
                message: msg,
                data: content,
            });
        }
    }

    // ==============================
    // TEMPLATE_UPDATED
    // ==============================
    if (routingKey === "TEMPLATE_UPDATED") {
        const msg = `Email template "${templateName}" has been updated`;

        await persistNotification(
            {
                hospitalIds: hospitalId ? [hospitalId] : [],
                staffIds: createdBy ? [createdBy] : [],
                message: msg,
                metadata: {
                    type: "TEMPLATE",
                    event: routingKey,
                    templateId: content.templateId,
                    templateName,
                },
            },
            "Failed to save TEMPLATE_UPDATED notification"
        );

        if (hospitalId) {
            safeSocketEmit(`hospital_${hospitalId}`, "template_event", {
                event: routingKey,
                message: msg,
                data: content,
            });
        }

        if (createdBy) {
            safeSocketEmit(`staff_${createdBy}`, "template_event", {
                event: routingKey,
                message: msg,
                data: content,
            });
        }
    }

    // ==============================
    // TEMPLATE_DELETED
    // ==============================
    if (routingKey === "TEMPLATE_DELETED") {
        const msg = `Email template "${templateName}" has been deleted`;

        await persistNotification(
            {
                hospitalIds: hospitalId ? [hospitalId] : [],
                staffIds: createdBy ? [createdBy] : [],
                message: msg,
                metadata: {
                    type: "TEMPLATE",
                    event: routingKey,
                    templateId: content.templateId,
                    templateName,
                },
            },
            "Failed to save TEMPLATE_DELETED notification"
        );

        if (hospitalId) {
            safeSocketEmit(`hospital_${hospitalId}`, "template_event", {
                event: routingKey,
                message: msg,
                data: content,
            });
        }

        if (createdBy) {
            safeSocketEmit(`staff_${createdBy}`, "template_event", {
                event: routingKey,
                message: msg,
                data: content,
            });
        }
    }
};
