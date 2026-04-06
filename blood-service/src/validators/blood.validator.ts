import { z } from "zod";

export const donorSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be a 10-digit number"),
  userId: z.number().int(),
  dateOfBirth: z.string().or(z.date()),
  bloodGroup: z.enum(["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"]),
  address: z.object({
    place: z.string(),
    pincode: z.number().int(),
    country: z.string().optional(),
    state: z.string().optional(),
    district: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
    id: z.string().regex(/^\d+$/),
});
