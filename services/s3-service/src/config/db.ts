
// services/s3-service/src/config/db.ts

// S3 service does not require a database connection.
// Keep this file only if other code still imports it.
export const connectDB = async (): Promise<void> => {
  console.log("ℹ️ Database connection skipped for S3 Service");
};

export default null;