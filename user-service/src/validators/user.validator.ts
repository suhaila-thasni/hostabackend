import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().regex(/^[0-9]{10}$/),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

export const loginWithPhoneSchema = z.object({
    phone: z.string().regex(/^[0-9]{10}$/, "Phone must be a 10-digit number"),
});

export const verifyOtpSchema = z.object({
    phone: z.string().regex(/^[0-9]{10}$/, "Phone must be a 10-digit number"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    FcmToken: z.string().optional(),
});
