import { Request, Response } from "express";
import * as EmailService from "../services/email.service";

export const sendEmailNotification = async (
    req: any,
    res: Response
) => {

    const {
        doctorIds,
        staffIds,
        subject,
        message
    } = req.body;

    await EmailService.sendEmailNotification({
        hospitalId: req.user.hospitalId,
        createdBy: req.user.id,
        doctorIds,
        staffIds,
        subject,
        message
    });

    return res.status(202).json({
        success: true,
        message: "Email notification queued successfully."
    });

};