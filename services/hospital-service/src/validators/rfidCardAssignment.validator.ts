import { z } from "zod";

export const rfidCardAssignmentSchema = z.object({
  hospitalId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  employeeType: z.enum(["Doctor", "Staff"]),
  employeeName: z.string().min(1, "Employee name is required"),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  deviceId: z.string().min(1, "Device ID is required"),
  deviceDbId: z.number().int().positive().optional(),
  cardNumber: z.string().min(1, "Card number is required"),
});

export const updateRfidCardAssignmentSchema = z.object({
  employeeName: z.string().min(1).optional(),
  employeeCode: z.string().optional(),
  department: z.string().optional(),
  deviceId: z.string().min(1).optional(),
  deviceDbId: z.number().int().positive().optional(),
  cardNumber: z.string().min(1).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});
