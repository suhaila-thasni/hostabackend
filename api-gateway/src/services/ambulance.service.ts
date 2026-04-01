import axios, { AxiosError } from "axios";
import { Request, Response } from "express";
import { SERVICES } from "../config/services";

export const proxyRequest = async (req: Request, res: Response) => {
  try {
    // Add timeout to prevent hanging requests
    const response = await axios({
      method: req.method as any,
      url: `${SERVICES.AMBULANCE_SERVICE}${req.originalUrl.replace("/api", "")}`,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined,
        // Remove sensitive headers
        authorization: req.headers.authorization
      },
      timeout: 30000, // 30 seconds timeout
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({
        success: false,
        message: "Service timeout",
        error: { code: "SERVICE_TIMEOUT", details: null }
      });
      return;
    }

    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        message: "Service unavailable",
        error: { code: "SERVICE_UNAVAILABLE", details: null }
      });
      return;
    }

    // Handle Axios errors properly
    if (error instanceof AxiosError && error.response) {
      res.status(error.response.status).json({
        success: false,
        message: "Service error",
        error: {
          code: "SERVICE_ERROR",
          details: process.env.NODE_ENV === "development" ? error.response.data : null
        }
      });
      return;
    }

    // Generic error - don't expose internal details
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: { code: "INTERNAL_ERROR", details: null }
    });
  }
};
