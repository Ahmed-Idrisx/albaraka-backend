import "dotenv/config";
import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().min(1),

  CORS_ORIGIN: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("30d"),

  SUPERADMIN_NAME: z.preprocess(
    blankToUndefined,
    z.string().min(1).optional(),
  ),
  SUPERADMIN_EMAIL: z.preprocess(
    blankToUndefined,
    z.string().email().optional(),
  ),
  SUPERADMIN_PASSWORD: z.preprocess(
    blankToUndefined,
    z.string().min(8).optional(),
  ),

  VAPID_PUBLIC_KEY: z.preprocess(
    blankToUndefined,
    z.string().min(1).optional(),
  ),
  VAPID_PRIVATE_KEY: z.preprocess(
    blankToUndefined,
    z.string().min(1).optional(),
  ),
  VAPID_SUBJECT: z.preprocess(
    blankToUndefined,
    z.string().url().optional(),
  ),

  IMAGEKIT_PUBLIC_KEY: z.string().min(1),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.string().url(),
});

export const env = envSchema.parse(process.env);
