import app from "./app";
import { connectDB } from "./config/db";
import { connectRabbitMQ } from "./events/publisher";
import { env } from "./config/env";
import { logger } from "./utils/logger";

import "./models"; 

const PORT = env.PORT;

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();

       const { default: Role } = await import("./models/role.model");
        const { default: Rolepermission } = await import("./models/rolepermission.model");
        const { default: Permission } = await import("./models/permission.model");

        await Role.sync({ alter: true });
        await Rolepermission.sync({ alter: true });
        await Permission.sync({ alter: true });

    app.listen(PORT, () => {
      logger.info(`🚀 Role Service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", { error });
    process.exit(1);
  }
};

startServer();