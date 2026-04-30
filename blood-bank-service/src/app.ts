import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/bloodBank.routes";
import { logger } from "./utils/logger";
import { env } from "./config/env";

const app = express();

// Security middleware
app.use(helmet());

// Logging
app.use(morgan("dev"));

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://yourfrontend.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Request Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Main Routes
app.use("/blood-bank", routes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "blood-bank-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 404,
    message: "Requested blood-bank-related resource not found",
    path: req.path,
  });
});

// Global Error handler with Winston
app.use((err: any, req: any, res: Response, next: NextFunction) => {
  logger.error("Server error", {
    message: err.message,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error in Blood Bank Service",
    error: env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
