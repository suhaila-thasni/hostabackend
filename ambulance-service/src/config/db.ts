import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`❌ Missing required DB environment variables: ${missingEnvVars.join(', ')}`);
}


const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST!,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, 
      },
    },
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected (Ambulance Service)");

    // Note: In production, use migrations instead of sync
    // if (env.NODE_ENV === "development") {
    //   await sequelize.sync();
    // }
  } catch (error) {
    console.error("❌ DB Error:", error);
    process.exit(1);
  }
};

export default sequelize;