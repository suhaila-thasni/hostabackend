import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import ambulanceRoutes from "./routes/ambulance.routes";
import { requestLogger } from "./middleware/logger.middleware";
import { logger } from "./utils/logger";
import { env } from "./config/env";

const app = express();

// Security middleware
app.use(helmet());

// Request Tracking & Logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    error: { code: "RATE_LIMIT_EXCEEDED", details: null }
  }
});
app.use(limiter);

// Strict limit for login route
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes."
});
app.use("/ambulance/login", loginLimiter);

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://yourfrontend.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ROUTES
app.use("/", ambulanceRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "ambulance-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 404,
    message: "Requested ambulance-related resource not found",
    path: req.path,
  });
});

// Global Error handler with Winston
app.use((err: any, req: any, res: Response, next: NextFunction) => {
  logger.error("Server error", {
    requestId: req.id,
    message: err.message,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error in Ambulance Service",
    error: env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
