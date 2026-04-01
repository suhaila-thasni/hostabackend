import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import logger from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import ambulanceRoutes from "./routes/ambulance.routes";

const app = express();

// Security middleware
app.use(helmet());

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

app.use(cors());
app.use(logger("dev"));
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
    environment: process.env.NODE_ENV || "development"
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

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    status: err.status || 500,
    message: err.message || "Internal Server Error in Ambulance Service",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

export default app;
