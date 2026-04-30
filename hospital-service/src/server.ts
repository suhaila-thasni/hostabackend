import app from "./app";

import { connectDB } from "./config/db";
import { connectRabbitMQ } from "./events/publisher";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const PORT = env.PORT;

// Database Connection and Server Startup
const startServer = async () => {
    try {
        await connectDB();
        await connectRabbitMQ();
        // Ensure tables are in sync
        const { default: Hospital } = await import("./models/hospital.model");
        await Hospital.sync({ alter: true });
        
        // Starting Hospital Service
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Hospital Service is running on port ${PORT}`);
        });

        // Graceful Shutdown Handler
        process.on("SIGTERM", async () => {
            logger.info("SIGTERM received. Shutting down gracefully...");
            server.close(() => {
                logger.info("HTTP server closed.");
            });
            process.exit(0);
        });
    } catch (error) {
        logger.error("❌ Failed to start server:", { error });
        process.exit(1);
    }
};

startServer();
