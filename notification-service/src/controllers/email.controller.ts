import { Request, Response } from "express";
import * as EmailService from "../services/email.service";

// ── Save Draft ──
export const saveDraft = async (
    req: any,
    res: Response
) => {
    const draft = await EmailService.saveDraft({
        hospitalId: req.user.hospitalId,
        createdBy: req.user.id,
        ...req.body
    });

    return res.status(201).json({
        success: true,
        message: "Draft saved successfully.",
        data: draft
    });
};

// ── Send Email (new) ──
export const sendEmailNotification = async (
    req: any,
    res: Response
) => {
    const {
        recipients,
        subject,
        message,
        templateId
    } = req.body;

    await EmailService.sendEmailNotification({
        hospitalId: req.user.hospitalId,
        createdBy: req.user.id,
        recipients,
        subject,
        message,
        templateId
    });

    return res.status(202).json({
        success: true,
        message: "Email notification queued successfully."
    });
};

// ── Send a Draft ──
export const sendDraft = async (
    req: any,
    res: Response
) => {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email notification ID",
        });
    }

    const result = await EmailService.sendDraft(notificationId, req.user.hospitalId);

    if (!result) {
        return res.status(404).json({
            success: false,
            message: "Draft not found or already sent",
        });
    }

    return res.status(202).json({
        success: true,
        message: "Draft email queued for sending.",
        data: result
    });
};

// ── List ──
export const getEmailNotifications = async (
    req: Request,
    res: Response
) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await EmailService.getEmailNotifications({
        limit,
        offset,
    });

    return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
            total: count,
            page,
            pages: Math.ceil(count / limit),
            limit,
        },
    });
};

// ── Get by ID ──
export const getEmailNotificationById = async (
    req: Request,
    res: Response
) => {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email notification ID",
        });
    }

    const notification = await EmailService.getEmailNotificationById(notificationId);

    if (!notification) {
        return res.status(404).json({
            success: false,
            message: "Email notification not found",
        });
    }

    return res.status(200).json({
        success: true,
        data: notification,
    });
};

// ── Update (DRAFT only) ──
export const updateEmailNotification = async (
    req: Request,
    res: Response
) => {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email notification ID",
        });
    }

    const updated = await EmailService.updateEmailNotification(
        notificationId,
        req.body
    );

    if (!updated) {
        return res.status(404).json({
            success: false,
            message: "Email notification not found, not a draft, or not updated",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Email notification updated successfully",
        data: updated,
    });
};

// ── Delete (DRAFT only) ──
export const deleteEmailNotification = async (
    req: Request,
    res: Response
) => {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email notification ID",
        });
    }

    const deleted = await EmailService.deleteEmailNotification(notificationId);

    if (!deleted) {
        return res.status(404).json({
            success: false,
            message: "Email notification not found or not a draft",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Email notification deleted successfully",
    });
};

// ── Duplicate ──
export const duplicateEmail = async (
    req: Request,
    res: Response
) => {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email notification ID",
        });
    }

    const duplicate = await EmailService.duplicateEmail(notificationId);

    if (!duplicate) {
        return res.status(404).json({
            success: false,
            message: "Email notification not found",
        });
    }

    return res.status(201).json({
        success: true,
        message: "Email duplicated as draft successfully",
        data: duplicate,
    });
};

// ── Resend ──
export const resendEmail = async (
    req: any,
    res: Response
) => {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email notification ID",
        });
    }

    const resent = await EmailService.resendEmail(notificationId, req.user.hospitalId);

    if (!resent) {
        return res.status(404).json({
            success: false,
            message: "Email notification not found",
        });
    }

    return res.status(202).json({
        success: true,
        message: "Email resent and queued successfully",
        data: resent,
    });
};

// ── Archive ──
export const archiveEmail = async (
    req: Request,
    res: Response
) => {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email notification ID",
        });
    }

    const archived = await EmailService.archiveEmail(notificationId);

    if (!archived) {
        return res.status(404).json({
            success: false,
            message: "Email notification not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Email archived successfully",
        data: archived,
    });
};