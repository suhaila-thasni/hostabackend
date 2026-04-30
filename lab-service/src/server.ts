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
        
        // Ensure tables exist safely
        const { default: Lab } = await import("./models/lab.model");
        const { default: Report } = await import("./models/report.model");
        const { default: Test } = await import("./models/test.model");

        await Lab.sync({ alter: true });
        await Report.sync({ alter: true });
        await Test.sync({ alter: true });
        
        // Starting blood Service
        app.listen(PORT, () => {
            logger.info(`🚀 Lab Service is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("❌ Failed to start server:", { error });
        process.exit(1);
    }
};

startServer();
