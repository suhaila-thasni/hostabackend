import { z } from "zod";

export const createLeaveTemplateSchema = z.object({
  hospitalId: z.number().int().optional().nullable(),
  employeeId: z.number().int().optional().nullable(),
  employeeType: z.enum(["Doctor", "Staff", "Admin", "System"]).optional(),
  templateName: z.string().min(1, { message: "templateName is required" }),
  reasonCategory: z.string().min(1, { message: "reasonCategory is required" }),
  templateText: z.string().min(1, { message: "templateText is required" }),
  placeholders: z.array(z.string()).optional(),
  isPredefined: z.boolean().optional().default(false),
  isRecommended: z.boolean().optional().default(false),
  icon: z.string().optional(),
});

export const updateLeaveTemplateSchema = createLeaveTemplateSchema.partial();

export const leaveTemplateIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a numeric integer"),
});

export const duplicateTemplateSchema = z.object({
  employeeId: z.number().int({ message: "employeeId is required for duplicating template" }),
  employeeType: z.enum(["Doctor", "Staff"]).optional().default("Staff"),
  templateName: z.string().optional(),
});
