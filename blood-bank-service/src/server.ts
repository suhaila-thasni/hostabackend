import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { connectRabbitMQ } from "./events/publisher";
import { startSubscriber } from "./events/subscriber";

const PORT = env.PORT;

// Database Connection and Server Startup
const startServer = async () => {
    try {
        await connectDB();
        
        // 🐰 Connect to Event Bus
        await connectRabbitMQ();
        
        // 📡 Start Listening for Events
        await startSubscriber();
        // Ensure tables are in sync
        const { default: BloodBank } = await import("./models/bloodBank.model");
        await BloodBank.sync({ alter: true });

        // Starting Blood Bank Service
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Blood Bank Service is running on port ${PORT}`);
        });

        // Graceful Shutdown Handler
        process.on("SIGTERM", () => {
            logger.info("SIGTERM received. Shutting down gracefully...");
            server.close(async () => {
                logger.info("HTTP server closed.");
                // Add any other cleanup here (DB close)
                process.exit(0);
            });

            // Force exit after 10s if server.close is stuck
            setTimeout(() => {
                logger.error("Could not close connections in time, forcefully shutting down");
                process.exit(1);
            }, 10000);
        });
        
    } catch (error) {
        logger.error("❌ Failed to start server:", { error });
        process.exit(1);
    }
};

startServer();
