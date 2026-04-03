import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (payload: any) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET);
};
