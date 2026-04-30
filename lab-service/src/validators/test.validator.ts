import { z } from "zod";

/* =======================
   CREATE TEST
======================= */

export const createTestSchema = z.object({
  test_name: z.string().min(1, "Test name is required"),
  test_no: z.number().int().positive("Test number must be a positive integer"),
  type: z.string().min(1, "Type is required"),
  rate: z.number().positive("Rate must be a positive number"),
  discount: z.number().min(0).optional(),
});

/* =======================
   UPDATE TEST
======================= */

export const updateTestSchema = z.object({
  test_name: z.string().min(1, "Test name is required").optional(),
  test_no: z.number().int().positive().optional(),
  type: z.string().min(1, "Type is required").optional(),
  rate: z.number().positive("Rate must be a positive number").optional(),
  discount: z.number().min(0).optional(),
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

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
