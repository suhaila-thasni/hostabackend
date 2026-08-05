import { z } from "zod";

export const createEmailNotificationSchema = z.object({
  doctorIds: z.array(z.number()).optional(),
  staffIds: z.array(z.number()).optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  templateId: z.number().optional(),
}).refine(data => (data.subject && data.message) || data.templateId, {
  message: "Either (subject and message) or templateId must be provided",
});

export const updateEmailNotificationSchema = z.object({
  subject: z.string().optional(),
  message: z.string().optional(),
  doctorIds: z.array(z.number()).optional(),
  staffIds: z.array(z.number()).optional(),
  templateId: z.number().optional(),
});

export const saveDraftSchema = z.object({
  doctorIds: z.array(z.number()).optional(),
  staffIds: z.array(z.number()).optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  templateId: z.number().optional(),
});
