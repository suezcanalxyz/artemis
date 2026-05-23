import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_URL: z.string().url(),
  WEB_URL: z.string().url(),
  ARTEMIS_BASE_DOMAIN: z.string().min(1).default("artemis.network"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_KEY_PREFIX: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().min(2),
  REFRESH_TOKEN_TTL: z.string().min(2),
  UPLOAD_ROOT: z.string().min(1),
  SENTRY_DSN: z.string().optional().default(""),
  RESEND_API_KEY: z.string().min(1).default("resend-placeholder"),
  EMAIL_FROM: z.string().min(3).default("Artemis <noreply@artemis.network>"),
  CADDY_ASK_TOKEN: z.string().min(16).default("replace-me-please"),
  DOMAIN_VERIFICATION_CNAME_TARGET: z
    .string()
    .min(1)
    .default("verify.artemis.network"),
  START_WORKERS: z.enum(["true", "false"]).default("false")
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment: ${parsed.error.message}`);
}

export const config = {
  ...parsed.data,
  UPLOAD_ROOT: path.resolve(parsed.data.UPLOAD_ROOT)
};
