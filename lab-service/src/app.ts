import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import labRoutes from "./routes/lab.routes";
import testRoutes from "./routes/test.routes";
import reportRoutes from "./routes/report.routes";
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
  max: 100, // Reduced from 1000 to production-typical 100

  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
    error: { code: "RATE_LIMIT_EXCEEDED", details: null }
  }
});
app.use(limiter);


// Specific limit for login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again after 15 minutes."
});
app.use("/lab/login", loginLimiter); // can be changed if logic changes
app.use("/report/login", loginLimiter); // can be changed if logic changes
app.use("/test/login", loginLimiter); // can be changed if logic changes


// CORS
app.use(cors({
  origin: ["http://localhost:3000", "https://yourfrontend.com"], // Allowing local dev and prospective production
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ROUTES
app.use("/", labRoutes);
app.use("/", testRoutes);
app.use("/", reportRoutes);



// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "lab-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});


// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 404,
    message: "Requested lab-related resource not found",

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
    message: "Internal Server Error in Blood Service",
    error: env.NODE_ENV === "development" ? err : {}, // Still show object in dev, hide details in prod

  });
});

export default app;
