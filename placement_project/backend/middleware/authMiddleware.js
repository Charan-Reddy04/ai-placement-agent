import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export default function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
