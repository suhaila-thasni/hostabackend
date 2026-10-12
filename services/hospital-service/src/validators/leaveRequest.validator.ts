import { z } from "zod";

export const createLeaveRequestSchema = z.object({
  hospitalId: z.number().int({ message: "hospitalId is required and must be an integer" }),
  employeeId: z.number().int({ message: "employeeId is required and must be an integer" }),
  employeeType: z.enum(["Doctor", "Staff", "Nurse", "Receptionist", "Admin"]).default("Staff"),
  employeeName: z.string().optional(),
  employeeEmail: z.string().email().optional().or(z.literal("")),
  department: z.string().optional(),
  leaveType: z.string().min(1, { message: "leaveType is required" }),
  startDate: z.string().min(1, { message: "startDate is required (YYYY-MM-DD)" }),
  endDate: z.string().min(1, { message: "endDate is required (YYYY-MM-DD)" }),
  totalDays: z.number().positive().optional(),
  templateId: z.number().int().optional().nullable(),
  reasonCategory: z.string().optional(),
  reason: z.string().min(1, { message: "reason is required" }),
  additionalDetails: z.string().optional().nullable(),
  handoverToId: z.number().int().optional().nullable(),
  handoverToName: z.string().optional().nullable(),
  handoverToType: z.string().optional().nullable(),
  handoverNotes: z.string().optional().nullable(),
  isConfirmed: z.boolean().optional().default(true),
});

export const updateLeaveStatusSchema = z.object({
  status: z.enum(["Approved", "Rejected", "Pending", "Cancelled"], {
    message: "status must be Approved, Rejected, Pending, or Cancelled",
  }),
  adminComments: z.string().optional().nullable(),
  actionByName: z.string().optional(),
  actionBy: z.number().int().optional(),
});

export const updateLeaveRequestSchema = createLeaveRequestSchema.partial();

export const leaveIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a numeric integer"),
});
