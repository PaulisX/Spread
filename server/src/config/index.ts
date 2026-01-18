import dotenv from "dotenv";
import path from "path";

// Determine which .env file to load
const env = process.env.NODE_ENV || "development";
const envFile = env === "production" ? ".env.prod" : ".env.dev";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Helper to parse comma-separated values for lists
function parseList(value?: string): string[] {
  return value ? value.split(",").map((s) => s.trim()) : [];
}

// Export a typed config object
export default {
  env,
  port: process.env.PORT ? Number(process.env.PORT) : 2567,
  playground: process.env.PLAYGROUND === "true",
  cors: {
    origin: process.env.CORS_ORIGIN || "",
    credentials: true,
  },
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS),
};
