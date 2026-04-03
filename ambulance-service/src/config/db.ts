import { Sequelize } from "sequelize";
import { env } from "./env";

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",
  logging: env.NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

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