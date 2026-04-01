import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/jwt.service";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
      data: null,
      error: { code: "NO_TOKEN_PROVIDED", details: null },
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
      data: null,
      error: { code: "INVALID_TOKEN", details: null },
    });
    return;
  }

  (req as any).user = decoded;
  next();
};
