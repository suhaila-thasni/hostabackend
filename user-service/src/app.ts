import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/user.routes";
import { requestLogger } from "./middleware/logger.middleware";
import { logger } from "./utils/logger";
import { env } from "./config/env";

const app = express();

// ✅ FIX: Trust exactly 1 proxy (the API Gateway) to resolve ERR_ERL_PERMISSIVE_TRUST_PROXY
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());

// Request Tracking & Logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    error: { code: "RATE_LIMIT_EXCEEDED", details: null }
  }
});
app.use(limiter);

// Specific limit for login / OTP (prevents SMS spam bills)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased from 5 to 100 for dev testing
    message: {
      success: false,
      message: "Too many login or OTP attempts, please try again after 15 minutes."
    }
});
app.use("/users/login", loginLimiter);
app.use("/users/login/phone", loginLimiter);
app.use("/users/otp", loginLimiter);

// CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://yourfrontend.com"], // Allowing local dev and prospective production
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// ROUTES
app.use("/", userRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "user-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 404,
    message: "Requested user-related resource not found",
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
    message: "Internal Server Error in User Service",
    error: env.NODE_ENV === "development" ? err : {}, // Still show object in dev, hide details in prod
  });
});

export default app;
