import { Request, Response } from "express";
import axios from "axios";
import { Op } from "sequelize";
import LeaveTemplate from "../models/leaveTemplate.model";
import { publishEvent } from "../events/publisher";
import { logger } from "../utils/logger";

export const publishLeaveTemplateNotification = async (
  action: "CREATED" | "DUPLICATED" | "UPDATED" | "DELETED",
  template: any
) => {
  try {
    // DO NOT notify anyone if it's a personal (custom) template
    if (!template.isPredefined) {
      return;
    }

    let eventName = "";
    let title = "";
    let message = "";
    let severity = "info";

    switch (action) {
      case "CREATED":
        eventName = "LEAVE_TEMPLATE_CREATED";
        title = "New Leave Template";
        message = `A new hospital-wide leave template '${template.templateName}' is now available.`;
        severity = "success";
        break;
      case "DUPLICATED":
        // This won't trigger anymore since duplicated templates have isPredefined: false
        eventName = "LEAVE_TEMPLATE_DUPLICATED";
        title = "Leave Template Duplicated";
        message = `The leave template '${template.templateName}' was copied to My Templates.`;
        severity = "info";
        break;
      case "UPDATED":
        eventName = "LEAVE_TEMPLATE_UPDATED";
        title = "Leave Template Updated";
        message = `The hospital-wide leave template '${template.templateName}' has been updated.`;
        severity = "info";
        break;
      case "DELETED":
        eventName = "LEAVE_TEMPLATE_DELETED";
        title = "Leave Template Removed";
        message = `The hospital-wide leave template '${template.templateName}' was removed.`;
        severity = "warning";
        break;
    }

    // Fetch all staff and doctor IDs for this hospital so notification-service can fan out
    let staffIds: number[] = [];
    let doctorIds: number[] = [];

    if (template.hospitalId) {
      try {
        const staffRes = await axios.get(`${process.env.STAFF_SERVICE_URL}/staff`, {
          params: { hospitalId: template.hospitalId },
        });
        staffIds = (staffRes.data?.data ?? []).map((s: any) => s.id).filter(Boolean);
      } catch (err) {
        logger.warn("Could not fetch staffIds for template notification", { hospitalId: template.hospitalId });
      }

      try {
        const doctorRes = await axios.get(`${process.env.DOCTOR_SERVICE_URL}/doctor`, {
          params: { hospitalId: template.hospitalId },
        });
        doctorIds = (doctorRes.data?.data ?? []).map((d: any) => d.id).filter(Boolean);
      } catch (err) {
        logger.warn("Could not fetch doctorIds for template notification", { hospitalId: template.hospitalId });
      }
    }

    const eventPayload = {
      event: eventName,
      title,
      message,
      category: "template",
      severity,
      recipient: "both",
      staffIds,
      doctorIds,
      data: template,
      createdAt: new Date(),
    };

    await publishEvent("hospital_events", eventName, eventPayload);
    logger.info(`Successfully published ${eventName} to RabbitMQ for template ID ${template.id}`);
  } catch (err: any) {
    logger.error(`Failed to publish ${action} event:`, { error: err.message });
  }
};

/* =========================================================================
   DEFAULT PREDEFINED TEMPLATES (Used for initial seeding or fallback)
========================================================================= */
export const DEFAULT_PREDEFINED_TEMPLATES = [
  {
    templateName: "Wedding / Family Function",
    reasonCategory: "Family Event",
    templateText:
      "I am requesting leave from [start date] to [end date] to attend my [relation]'s wedding ceremony and complete the related family arrangements. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].",
    placeholders: ["[start date]", "[end date]", "[relation]", "[handover person]"],
    isPredefined: true,
    isRecommended: true,
    icon: "users",
  },
  {
    templateName: "Family Visit",
    reasonCategory: "Family Visit",
    templateText:
      "I am requesting leave from [start date] to [end date] to visit my family members. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].",
    placeholders: ["[start date]", "[end date]", "[handover person]"],
    isPredefined: true,
    isRecommended: false,
    icon: "home",
  },
  {
    templateName: "Religious / Cultural Event",
    reasonCategory: "Religious / Cultural",
    templateText:
      "I am requesting leave from [start date] to [end date] to participate in a religious/cultural event. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].",
    placeholders: ["[start date]", "[end date]", "[handover person]"],
    isPredefined: true,
    isRecommended: false,
    icon: "sun",
  },
  {
    templateName: "Travel / Vacation",
    reasonCategory: "Travel / Vacation",
    templateText:
      "I am requesting leave from [start date] to [end date] for a planned vacation/travel. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].",
    placeholders: ["[start date]", "[end date]", "[handover person]"],
    isPredefined: true,
    isRecommended: false,
    icon: "plane",
  },
  {
    templateName: "Medical / Health",
    reasonCategory: "Medical / Health",
    templateText:
      "I am requesting leave from [start date] to [end date] due to medical reasons. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].",
    placeholders: ["[start date]", "[end date]", "[handover person]"],
    isPredefined: true,
    isRecommended: false,
    icon: "plus-circle",
  },
  {
    templateName: "Personal / Other",
    reasonCategory: "Personal / Other",
    templateText:
      "I am requesting leave from [start date] to [end date] for personal reasons. I will complete my pending responsibilities before my leave and have handed over any necessary tasks to [handover person].",
    placeholders: ["[start date]", "[end date]", "[handover person]"],
    isPredefined: true,
    isRecommended: false,
    icon: "more-horizontal",
  },
];

/* =========================================================================
   1. CREATE LEAVE TEMPLATE (Custom or Predefined)
========================================================================= */
export const createLeaveTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      hospitalId,
      employeeId,
      employeeType,
      templateName,
      reasonCategory,
      templateText,
      placeholders,
      isPredefined,
      isRecommended,
      icon,
    } = req.body;

    const defaultPlaceholders = [
      "[start date]",
      "[end date]",
      "[total days]",
      "[reason]",
      "[relation]",
      "[handover person]",
    ];

    const template = await LeaveTemplate.create({
      hospitalId: hospitalId ? Number(hospitalId) : null,
      employeeId: employeeId ? Number(employeeId) : null,
      employeeType: employeeType || (employeeId ? "Staff" : "System"),
      templateName,
      reasonCategory,
      templateText,
      placeholders: placeholders || defaultPlaceholders,
      isPredefined: !employeeId,
      isRecommended: isRecommended === true,
      icon: icon || "file-text",
    });

    await publishLeaveTemplateNotification("CREATED", template);

    res.status(201).json({
      success: true,
      message: "Leave template created successfully",
      data: template,
    });
  } catch (error: any) {
    logger.error("Error creating leave template:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   2. GET LEAVE TEMPLATES (With Filters for My Templates & Predefined)
========================================================================= */
export const getLeaveTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: any = {};
    const andConditions: any[] = [];

    // Filter by predefined vs custom
    if (req.query.isPredefined !== undefined) {
      const isPredef = String(req.query.isPredefined).toLowerCase() === "true";
      where.isPredefined = isPredef;
    }

    // Filter by employee ("My Templates")
    if (req.query.employeeId) {
      const empId = Number(req.query.employeeId);
      const isPredefQuery = req.query.isPredefined !== undefined ? String(req.query.isPredefined).toLowerCase() : undefined;
      if (isPredefQuery === "false") {
        where.employeeId = empId;
      } else if (isPredefQuery === undefined) {
        andConditions.push({
          [Op.or]: [{ employeeId: empId }, { isPredefined: true }],
        });
      }
    }

    // Filter by reason category
    if (req.query.reasonCategory && req.query.reasonCategory !== "All Templates") {
      where.reasonCategory = req.query.reasonCategory;
    }

    // Filter by hospitalId if applicable
    if (req.query.hospitalId) {
      const hospId = Number(req.query.hospitalId);
      andConditions.push({
        [Op.or]: [{ hospitalId: hospId }, { hospitalId: null }],
      });
    }

    // Search
    if (req.query.search) {
      const searchTerm = `%${String(req.query.search).trim()}%`;
      andConditions.push({
        [Op.or]: [
          { templateName: { [Op.iLike]: searchTerm } },
          { reasonCategory: { [Op.iLike]: searchTerm } },
          { templateText: { [Op.iLike]: searchTerm } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
    }

    const templates = await LeaveTemplate.findAll({
      where,
      order: [
        ["isRecommended", "DESC"],
        ["isPredefined", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error: any) {
    logger.error("Error fetching leave templates:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   3. GET PREDEFINED TEMPLATES ONLY
========================================================================= */
export const getPredefinedLeaveTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const where: any = { isPredefined: true };
    if (req.query.reasonCategory && req.query.reasonCategory !== "All Templates") {
      where.reasonCategory = req.query.reasonCategory;
    }

    const templates = await LeaveTemplate.findAll({
      where,
      order: [
        ["isRecommended", "DESC"],
        ["createdAt", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error: any) {
    logger.error("Error fetching predefined leave templates:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   4. GET SINGLE TEMPLATE BY ID
========================================================================= */
export const getLeaveTemplateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const template = await LeaveTemplate.findByPk(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, message: "Leave template not found" });
      return;
    }
    res.status(200).json({ success: true, data: template });
  } catch (error: any) {
    logger.error("Error fetching leave template by ID:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   5. DUPLICATE TEMPLATE (Copy to "My Templates")
========================================================================= */
export const duplicateLeaveTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const sourceTemplate = await LeaveTemplate.findByPk(req.params.id);
    if (!sourceTemplate) {
      res.status(404).json({ success: false, message: "Source template not found" });
      return;
    }

    const { employeeId, employeeType, templateName } = req.body;

    const newTemplate = await LeaveTemplate.create({
      hospitalId: sourceTemplate.hospitalId,
      employeeId: Number(employeeId),
      employeeType: employeeType || "Staff",
      templateName: templateName || `${sourceTemplate.templateName} (Copy)`,
      reasonCategory: sourceTemplate.reasonCategory,
      templateText: sourceTemplate.templateText,
      placeholders: sourceTemplate.placeholders,
      isPredefined: false,
      isRecommended: false,
      icon: sourceTemplate.icon || "file-text",
    });

    await publishLeaveTemplateNotification("DUPLICATED", newTemplate);

    res.status(201).json({
      success: true,
      message: "Template copied to My Templates successfully",
      data: newTemplate,
    });
  } catch (error: any) {
    logger.error("Error duplicating leave template:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   6. UPDATE LEAVE TEMPLATE
========================================================================= */
export const updateLeaveTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const template = await LeaveTemplate.findByPk(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, message: "Leave template not found" });
      return;
    }

    await template.update(req.body);
    await publishLeaveTemplateNotification("UPDATED", template);

    res.status(200).json({
      success: true,
      message: "Leave template updated successfully",
      data: template,
    });
  } catch (error: any) {
    logger.error("Error updating leave template:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================================================
   7. DELETE LEAVE TEMPLATE
========================================================================= */
export const deleteLeaveTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const template = await LeaveTemplate.findByPk(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, message: "Leave template not found" });
      return;
    }

    await template.destroy();
    await publishLeaveTemplateNotification("DELETED", template);

    res.status(200).json({
      success: true,
      message: "Leave template deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting leave template:", { error: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};
