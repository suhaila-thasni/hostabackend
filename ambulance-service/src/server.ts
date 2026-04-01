import app from "./app";
import connectDB from "./config/db";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3004;

// Database Connection
connectDB();

// Starting ambulance Service
app.listen(PORT, () => {
  console.log(`🚀 Ambulance Service is running on port ${PORT}`);
});
