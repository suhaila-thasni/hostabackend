import { z } from "zod";

// Address schema
const addressSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  place: z.string().min(1, "Place is required"),
  pincode: z.number().min(100000, "Invalid pincode").max(999999, "Invalid pincode"),
});

// Working hours schema
const workingHoursSchema = z.object({
  day: z.string().min(1, "Day is required"),
  open: z.string().min(1, "Open time is required"),
  close: z.string().min(1, "Close time is required"),
  is_holiday: z.boolean().optional(),
});

// Registration validation
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  address: addressSchema,
  latitude: z.number({ error: "Latitude is required" }),
  longitude: z.number({ error: "Longitude is required" }),
  about: z.string().min(1, "About is required"),
  working_hours: z.array(workingHoursSchema).optional(),
  web: z.string().url("Invalid URL format").optional(),
  hospitalId: z.number().optional(),
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

// Login with phone (OTP request)
export const loginWithPhoneSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
});

// Login with email (OTP request for reset)
export const loginWithEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// OTP verification (Supports both phone and email)
export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits").optional(),
  email: z.string().email("Invalid email format").optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone is required",
  path: ["phone"],
});

// Update validation
export const updateSchema = registerSchema.partial();

// Change password validation (JWT based)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Reset password validation
export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginWithPhoneInput = z.infer<typeof loginWithPhoneSchema>;
export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
