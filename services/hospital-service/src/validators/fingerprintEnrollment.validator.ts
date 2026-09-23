import { z } from "zod";

export const fingerprintEnrollmentSchema = z
  .object({
    hospitalId: z.number().int().positive(),
    employeeId: z.number().int().positive(),
    employeeType: z.enum(["Doctor", "Staff"]),
    employeeName: z.string().min(1, "Employee name is required"),
    department: z.string().optional(),
    deviceId: z.string().min(1, "Device ID is required"),
    deviceDbId: z.number().int().positive().optional(),
    fingerPosition: z.string().min(1).optional(),
    fingerprintTemplate: z.string().min(1).optional(),
    fingerprintHash: z.string().min(1).optional(),
    templateReference: z.string().min(1).optional(),
    quality: z.enum(["Poor", "Fair", "Good", "Excellent"]).optional(),
    attempts: z.number().int().min(1).max(10).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.fingerprintTemplate && !data.fingerprintHash && !data.templateReference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fingerprintTemplate, fingerprintHash, or templateReference is required",
        path: ["fingerprintTemplate"],
      });
    }
  });

export const updateFingerprintEnrollmentSchema = z.object({
  employeeName: z.string().min(1).optional(),
  department: z.string().optional(),
  deviceId: z.string().min(1).optional(),
  deviceDbId: z.number().int().positive().optional(),
  fingerPosition: z.string().min(1).optional(),
  fingerprintTemplate: z.string().min(1).optional(),
  fingerprintHash: z.string().min(1).optional(),
  templateReference: z.string().min(1).optional(),
  quality: z.enum(["Poor", "Fair", "Good", "Excellent"]).optional(),
  attempts: z.number().int().min(1).max(10).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
