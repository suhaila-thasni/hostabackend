import { z } from "zod";

/* =======================
   TEST REPORT ITEM
======================= */

const testReportItemSchema = z.object({
  test_name: z.string().min(1, "Test name is required"),
  result: z.string().min(1, "Result is required"),
  ref_range: z.string().min(1, "Reference range is required"),
  units: z.string().min(1, "Units are required"),
});

/* =======================
   CREATE REPORT
======================= */

export const createReportSchema = z.object({
  // Patient info (optional, can be populated from patientId lookup)
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits").optional(),
  age: z.number().int().positive().optional(),
  location: z.string().optional(),
  gender: z.string().optional(),

  // Core report fields
  test_reports: z.array(testReportItemSchema).min(1, "At least one test report is required"),
  sample: z.string().min(1, "Sample type is required"),
  sample_date: z.string().datetime({ message: "Invalid sample date" }),
  result_ready: z.string().datetime({ message: "Invalid result ready date" }),

  // References
  patientId: z.number().int().positive("Patient ID must be a positive integer"),
  doctorId: z.number().int().positive("Doctor ID must be a positive integer"),

  // Metadata
  patient_type: z.string().min(1, "Patient type is required"),
  dept_unit: z.string().min(1, "Department/unit is required"),
  invoice_no: z.number().int().positive("Invoice number must be a positive integer"),
  invoice_date: z.string().datetime({ message: "Invalid invoice date" }),

  // Optional
  referred_by: z.string().optional(),
  result_verified: z.string().optional(),
});

/* =======================
   UPDATE REPORT
======================= */

export const updateReportSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits").optional(),
  age: z.number().int().positive().optional(),
  location: z.string().optional(),
  gender: z.string().optional(),

  test_reports: z.array(testReportItemSchema).optional(),
  sample: z.string().optional(),
  sample_date: z.string().datetime().optional(),
  result_ready: z.string().datetime().optional(),

  patientId: z.number().int().positive().optional(),
  doctorId: z.number().int().positive().optional(),

  patient_type: z.string().optional(),
  dept_unit: z.string().optional(),
  invoice_no: z.number().int().positive().optional(),
  invoice_date: z.string().datetime().optional(),

  referred_by: z.string().optional(),
  result_verified: z.string().optional(),
  isActive: z.boolean().optional(),
});

/* =======================
   ID PARAM
======================= */

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

/* =======================
   INFERRED TYPES
======================= */

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
