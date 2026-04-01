import axios from "axios";
import { Request, Response } from "express";
import { SERVICES } from "../config/services";

export const proxyRequest = async (req: Request, res: Response) => {
  try {
    const response = await axios({
      method: req.method as any,
      url: `${SERVICES.AMBULANCE_SERVICE}${req.originalUrl.replace("/api", "")}`,
      data: req.body,
      headers: { ...req.headers, host: undefined },
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      message: "Ambulance Service error",
      error: error.message,
    });
  }
};
