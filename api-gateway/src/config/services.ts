// Validate required environment variables
if (!process.env.AMBULANCE_SERVICE_URL) {
  throw new Error("❌ AMBULANCE_SERVICE_URL environment variable is required");
}

export const SERVICES = {
  AMBULANCE_SERVICE: process.env.AMBULANCE_SERVICE_URL!,
};
