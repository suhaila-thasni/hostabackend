import { z } from "zod";

const addressSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  place: z.string().min(1, "Place is required"),
  pincode: z.number().min(100000, "Invalid pincode").max(999999, "Invalid pincode"),
});

export const registerStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  designation: z.string().optional(),
  joiningDate: z.string().optional(),
  staffType: z.string().optional(),
  jobType: z.string().optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  knowLanguages: z.array(z.string()).optional(),
  qualification: z.string().optional(),
  address: addressSchema,
});

export const updateStaffSchema = registerStaffSchema.partial();

export const loginStaffSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type LoginStaffInput = z.infer<typeof loginStaffSchema>;
