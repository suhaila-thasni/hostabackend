import { z } from "zod";

export const createEmailNotificationSchema = z.object({
  doctorIds: z.array(z.number()).optional(),
  staffIds: z.array(z.number()).optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  templateId: z.number().optional(),
});

export const updateEmailNotificationSchema = z.object({
  subject: z.string().min(1, "Subject is required").optional(),
  message: z.string().min(1, "Message is required").optional(),
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
