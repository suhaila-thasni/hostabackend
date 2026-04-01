import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "ambulance_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "password",
  {
    host: process.env.DB_HOST || "postgres",
    dialect: "postgres",
    logging: false, // disable logs in production
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL Connected");

    await sequelize.sync(); // use migrations in real production
  } catch (error) {
    console.error("❌ DB Error:", error);
    process.exit(1);
  }
};

export default sequelize;