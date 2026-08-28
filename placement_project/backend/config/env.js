import dotenv from "dotenv";
dotenv.config();

const requiredInProduction = ["JWT_SECRET", "MONGO_URI"];
if (process.env.NODE_ENV === "production") {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/ai-placement-agent",
  jwtSecret: process.env.JWT_SECRET || "development-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  aiApiUrl: process.env.GROK_API_URL || process.env.AI_API_URL || "https://api.groq.com/openai/v1",
  aiApiKey: process.env.GROK_API_KEY || process.env.AI_API_KEY || "",
  aiModel: process.env.GROK_MODEL || process.env.AI_MODEL || "llama-3.3-70b-versatile",
  // .env.example has documented SMTP_HOST/PORT/USER/PASS since the project's
  // first commit, and "nodemailer" is a declared dependency in package.json,
  // but nothing in the codebase ever read these into config or called
  // nodemailer - email notifications were advertised but never wired up.
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
};
