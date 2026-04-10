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
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected (Doctor Service)");

    // ❌ REMOVE THIS IN PRODUCTION
    if (!isProduction) {
      await sequelize.sync({ alter: true });
      console.log("🚀 Database schema synchronized");
    }

  } catch (error) {
    console.error("❌ DB Error:", error);
    process.exit(1);
  }
};

export default sequelize;
