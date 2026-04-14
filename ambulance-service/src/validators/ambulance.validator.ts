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
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Invalid phone format").optional(),
  password: z.string().min(1, "Password is required"),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["email"],
});

export const loginWithPhoneSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  otp: z.string().length(6, "OTP must be 6 digits"),
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
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginWithPhoneInput = z.infer<typeof loginWithPhoneSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
