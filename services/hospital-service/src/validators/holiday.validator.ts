
import { z } from "zod";

export const createHolidaySchema = z.object({
  hospitalId: z.number().int(),
  name: z.string().min(1, "Holiday name is required"),
  type: z.enum([
    "Public Holiday",
    "National Holiday",
    "Religious Holiday",
    "Festival",
    "Company Holiday",
    "Optional Holiday",
    "Other"
  ]),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  repeatsAnnually: z.boolean().optional(),
  description: z.string().optional().nullable(),
});

export const updateHolidaySchema = createHolidaySchema.partial();
