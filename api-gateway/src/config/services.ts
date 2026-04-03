import { env } from "./env";

export const SERVICES = {
  USER_SERVICE: env.USER_SERVICE_URL,
  AMBULANCE_SERVICE: env.AMBULANCE_SERVICE_URL,
  BLOOD_SERVICE: env.BLOOD_SERVICE_URL,
};

if (!SERVICES.USER_SERVICE) {
  throw new Error("USER_SERVICE_URL not defined");
}

if (!SERVICES.AMBULANCE_SERVICE) {
  throw new Error("AMBULANCE_SERVICE_URL not defined");
}

if (!SERVICES.BLOOD_SERVICE) {
  throw new Error("BLOOD_SERVICE_URL not defined");
}
