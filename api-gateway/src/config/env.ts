import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().default("3000"),
  USER_SERVICE_URL: z.string().url(),
  AMBULANCE_SERVICE_URL: z.string().url(),
  BLOOD_SERVICE_URL: z.string().url(),
  BLOOD_BANK_SERVICE_URL: z.string().url(),
  PHARMACY_SERVICE_URL: z.string().url(),
  STAFF_SERVICE_URL: z.string().url(),
  JWT_SECRET: z.string().min(10),
  DOCTOR_SERVICE_URL: z.string().url(),
  SPECIALITY_SERVICE_URL: z.string().url(),
  HOSPITAL_SERVICE_URL: z.string().url(),
  MEDICINREMINDER_SERVICE_URL: z.string().url(),
  BOOKING_SERVICE_URL: z.string().url(),
});


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables in API Gateway:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
