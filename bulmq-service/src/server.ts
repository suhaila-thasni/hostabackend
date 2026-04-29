import app from "./app";

import { connectDB } from "./config/db";
import { connectRabbitMQ } from "./events/publisher";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import medicinWorker from "./worker/medicin-remainder.worker";
import bookingWorker from "./worker/booking-remainder.worker";


const PORT = env.PORT;

// Database Connection and Server Startup
const startServer = async () => {
    try {
        // await connectDB();
       
        await connectRabbitMQ();
        
      await  medicinWorker
      await bookingWorker
        
        // Starting blood Service
        app.listen(PORT, () => {
            logger.info(`🚀 Bulmq Service is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("❌ Failed to start server:", { error });
        process.exit(1);
    }
};

startServer();
