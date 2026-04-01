import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Validate JWT_SECRET on startup
if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET environment variable is required");
}

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
