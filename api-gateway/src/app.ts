import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";
import { env } from "./config/env";
import { requestLogger } from "./middleware/logger.middleware";

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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

// Specific limit for login attempt through gateway
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again after 15 minutes."
});
app.use("/api/users/login", loginLimiter);
app.use("/api/ambulance/login", loginLimiter);

// CORS
app.use(cors({
    origin: ["http://localhost:3000", "https://yourfrontend.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "healthy",
        service: "api-gateway",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV
    });
});

// Routes
app.use("/api", routes);

// Error Handling
app.use(errorHandler);

export default app;
