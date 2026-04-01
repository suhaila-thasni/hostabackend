import dotenv from "dotenv";
dotenv.config();

import app from "./app";

// Validate required environment variables
const requiredEnvVars = ['PORT', 'AMBULANCE_SERVICE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const PORT = process.env.PORT!;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway (Production Ready) running on port ${PORT}`);
});
