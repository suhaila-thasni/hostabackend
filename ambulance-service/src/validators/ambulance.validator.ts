import { z } from "zod";

// Address schema
const addressSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  place: z.string().min(1, "Place is required"),
  pincode: z.number().min(100000, "Invalid pincode").max(999999, "Invalid pincode"),
});

// Registration validation
export const registerSchema = z.object({
  serviceName: z.string().min(2, "Service name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  vehicleType: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  address: addressSchema,
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Update validation
export const updateSchema = z.object({
  serviceName: z.string().min(2, "Service name must be at least 2 characters").optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits").optional(),
  vehicleType: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  address: addressSchema.optional(),
});

// Change password validation
export const changePasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Forget password validation
export const forgetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>;
