import { Request, Response, NextFunction } from "express";
import CircuitBreaker from "opossum";
import { httpClient } from "../utils/httpClient";
import { SERVICES } from "../config/services";
import { logger } from "../utils/logger";

const callBloodBankService = async (options: any) => {
  return httpClient(options);
};

const breaker = new CircuitBreaker(callBloodBankService, {
  timeout: 10000, 
  errorThresholdPercentage: 50, 
  resetTimeout: 10000, 
});

breaker.fallback(() => {
  return { status: 503, data: { success: false, message: "Blood Bank service temporarily unavailable" } };
});

export const proxyRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 🛡️ Safe Path Mapping: Gateway /api/blood-bank -> Microservice /blood-bank
    const url = `${SERVICES.BLOOD_BANK_SERVICE}${req.originalUrl.replace("/api", "")}`;

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
        "X-Request-ID": (req as any).id || "gateway-internal",
      },
      validateStatus: (status: number) => true, // Handle all responses, don't throw on 4xx/5xx
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
        message: "Blood Bank Service Error",
        data: error.response.data
      });
    } else {
      logger.error("API Gateway Proxy Error (Blood Bank):", {
        message: error.message,
        path: req.originalUrl,
        requestId: (req as any).id,
      });
      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable",
      });
    }
  }
};
