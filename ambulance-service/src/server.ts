import app from "./app";
import { connectDB } from "./config/db";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['PORT', 'RABBITMQ_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const PORT = process.env.PORT!;

// Database Connection
connectDB();

// Starting ambulance Service
app.listen(PORT, () => {
  console.log(`🚀 Ambulance Service is running on port ${PORT}`);
});
