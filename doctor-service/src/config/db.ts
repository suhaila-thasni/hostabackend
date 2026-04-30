import { Sequelize } from "sequelize";
import { env } from "./env";

const isProduction = env.NODE_ENV === "production";

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",

  logging: !isProduction,

  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: true, // ✅ secure
        },
      }
    : {},

  pool: {
    max: 10,        // ✅ better for production
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  let connected = false;
  let attempts = 0;
  const maxAttempts = 5;

  while (!connected && attempts < maxAttempts) {
    try {
      await sequelize.authenticate();
      console.log("✅ PostgreSQL Connected (Doctor Service)");
      connected = true;

      // ❌ REMOVE THIS IN PRODUCTION
      if (!isProduction) {
        await sequelize.sync({ alter: true });
        console.log("🚀 Database schema synchronized");
      }
    } catch (error) {
      attempts++;
      console.error(`❌ DB Connection attempt ${attempts} failed:`, error instanceof Error ? error.message : error);
      if (attempts < maxAttempts) {
        console.log("Retrying in 5 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.error("Max connection attempts reached. Exiting...");
        process.exit(1);
      }
    }
  }
};

export default sequelize;
