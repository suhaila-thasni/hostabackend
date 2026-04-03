import { Request, Response, NextFunction } from "express";
import CircuitBreaker from "opossum";
import { httpClient } from "../utils/httpClient";
import { SERVICES } from "../config/services";
import { logger } from "../utils/logger";

// Define the service call
const callUserService = async (options: any) => {
  return httpClient(options);
};

// Create Circuit Breaker instance
const breaker = new CircuitBreaker(callUserService, {
  timeout: 10000, // If service call takes longer than 10s, count as failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
  resetTimeout: 10000, // Wait 10s before trying again
});

// Fallback behavior
breaker.fallback(() => {
  return { status: 503, data: { success: false, message: "User service temporarily unavailable" } };
});

export const proxyRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = `${SERVICES.USER_SERVICE}${req.originalUrl.replace("/api/users", "/users").replace("/api/patients", "/patients")}`;

    const options = {
      method: req.method,
      url: url,
      data: req.body,
      params: req.query,
      headers: {
        ...(() => {
          const { host, "content-length": contentLength, "transfer-encoding": transferEncoding, ...headers } = req.headers;
          return headers;
        })(),
        "X-Request-ID": (req as any).id,
      },
      // Ensure we get raw response for manual management
      validateStatus: (status: number) => status < 500, 
    };

    const response: any = await breaker.fire(options);

    res.status(response.status).json({
        success: response.status < 400,
        data: response.data,
    });

  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: "Service error",
        data: error.response.data
      });
    } else {
      logger.error("API Gateway Proxy Error:", {
        message: error.message,
        path: req.originalUrl,
        requestId: (req as any).id,
      });
      res.status(503).json({
        success: false,
        message: "Service unavailable",
      });
    }
  }
};
