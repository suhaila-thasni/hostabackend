import { z } from "zod";

const addressSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  place: z.string().min(1, "Place is required"),
  pincode: z.number().min(100000, "Invalid pincode").max(999999, "Invalid pincode"),
});

const consultingSessionSchema = z.object({
  open: z.string().min(1, "Open time is required"),
  close: z.string().min(1, "Close time is required"),
});

const consultingSchema = z.object({
  morning_session: consultingSessionSchema.optional(),
  evening_session: consultingSessionSchema.optional(),
});

export const registerDoctorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  displayName: z.string().min(1, "Display name is required"),
  department: z.string().optional(),
  specialist: z.string().optional(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  fees: z.number().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  knowLanguages: z.array(z.string()).optional(),
  qualification: z.string().optional(),
  address: addressSchema,
  consulting: consultingSchema.optional(),
  bookingOpen: z.boolean().default(true),
});

export const updateDoctorSchema = registerDoctorSchema.partial();

export const loginDoctorSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid ID format"),
});

export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
export type LoginDoctorInput = z.infer<typeof loginDoctorSchema>;
