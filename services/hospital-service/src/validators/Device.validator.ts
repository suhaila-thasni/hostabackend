import { z } from "zod";

export const registerRfidDeviceSchema = z.object({
  hospitalId: z.number().positive("Valid hospital ID is required"),
  deviceId: z.string().min(1, "Device ID is required"),
  deviceName: z.string().min(1, "Device Name is required"),
  location: z.string().min(1, "Location is required"),
  locationImage: z.string().optional(),
  deviceImage: z.string().optional(),
  deviceType: z.enum(["face", "rfid", "fingerprint"], { message: "Device Type must be face, rfid, or fingerprint" }),
});

export const updateRfidDeviceSchema = z.object({
  deviceName: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  locationImage: z.string().optional(),
  deviceImage: z.string().optional(),
  deviceType: z.enum(["face", "rfid", "fingerprint"]).optional(),
  status: z.enum(["Active", "Disabled"]).optional(),
});
