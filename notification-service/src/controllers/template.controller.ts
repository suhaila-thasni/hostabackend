import { Request, Response } from "express";
import * as TemplateService from "../services/template.service";

export const createTemplate = async (req: any, res: Response) => {
    try {
        const template = await TemplateService.createTemplate({
            hospitalId: req.user.hospitalId,
            createdBy: req.user.id,
            ...req.body
        });

        return res.status(201).json({
            success: true,
            message: "Template created successfully",
            data: template
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTemplates = async (req: any, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const { category, status } = req.query;

        const { count, rows } = await TemplateService.getTemplates({
            hospitalId: req.user.hospitalId,
            category: category as string,
            status: status as string,
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
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getTemplateById = async (req: any, res: Response) => {
    try {
        const templateId = Number(req.params.id);
        const template = await TemplateService.getTemplateById(templateId, req.user.hospitalId);

        if (!template) {
            return res.status(404).json({ success: false, message: "Template not found" });
        }

        return res.status(200).json({
            success: true,
            data: template,
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTemplate = async (req: any, res: Response) => {
    try {
        const templateId = Number(req.params.id);
        
        const updated = await TemplateService.updateTemplate(
            templateId,
            req.user.hospitalId,
            req.body
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: "Template not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Template updated successfully",
            data: updated,
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTemplate = async (req: any, res: Response) => {
    try {
        const templateId = Number(req.params.id);
        
        const deleted = await TemplateService.deleteTemplate(templateId, req.user.hospitalId);

        if (!deleted) {
            return res.status(404).json({ success: false, message: "Template not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Template deleted successfully",
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
