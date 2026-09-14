import { z } from "zod";

/* =======================
   ATTENDANCE SCHEMAS
======================= */

const attendanceBaseSchema = z.object({
  hospitalId: z.number().int(),
  roleId: z.number().int(),
  type: z.enum(["check-in", "check-out"]),
  // `image` is the primary field for face verification (base64 or URL selfie)
  // `selfie_url` is a fallback alias used by some frontends
  image: z.string().optional(),
  selfie_url: z.string().optional(),
  method: z.string().optional(), // "Face" | "Access Card" | "Punch In"
  roles: z.any().optional(),
  department: z.string().optional(),
  timestamp: z.string().or(z.date()).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  status: z.string().optional(),
});

export const attendanceSchema = attendanceBaseSchema.superRefine((data, ctx) => {
  const hasTopLevelCoordinates = data.latitude !== undefined && data.longitude !== undefined;
  const hasLocationObject = data.location?.lat !== undefined && data.location?.lng !== undefined;

  if (!hasTopLevelCoordinates && !hasLocationObject) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "latitude/longitude or location.lat/location.lng is required",
      path: ["location"],
    });
  }
});

export const updateAttendanceSchema = attendanceBaseSchema.partial();

/* =======================
   PARAM SCHEMAS
======================= */

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});
