import { Sequelize } from "sequelize";
import { env } from "./env";

const isProduction = env.NODE_ENV === "production";
const useSSL =
  isProduction ||
  env.DATABASE_URL.includes("sslmode=require") ||
  env.DATABASE_URL.includes("ssl=true");

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",

  logging: !isProduction,

  dialectOptions: useSSL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: isProduction,
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
      console.log("✅ PostgreSQL Connected (User Service)");
      connected = true;

      // In dev: alter tables to match models. In prod: only create missing tables (safe).
      if (isProduction) {
        // await sequelize.sync(); // DISABLED - Use migrations instead // safe — only creates tables that don't exist
      } else {
        // await sequelize.sync({ alter: true }); // DISABLED — too slow on remote DB, causes service to be unavailable during startup
      }
      console.log("🚀 Database schema synchronized");
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
