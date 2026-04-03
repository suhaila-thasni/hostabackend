import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import "./events/publisher"; // Initialize RabbitMQ connection on startup

const PORT = env.PORT;

// Database Connection and Server Startup
const startServer = async () => {
  try {
    await connectDB();
    
    // Starting ambulance Service
    app.listen(PORT, () => {
      logger.info(`🚀 Ambulance Service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", { error });
    process.exit(1);
  }
};

startServer();
