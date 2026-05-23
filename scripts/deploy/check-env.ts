import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";

const envCandidates = [
  ".env.production",
  ".env",
  ".env.production.example",
  ".env.example"
];
const envFile = envCandidates.find((candidate) => existsSync(candidate));

if (envFile) {
  loadEnv({ path: envFile });
}

const required = [
  "NODE_ENV",
  "APP_URL",
  "WEB_URL",
  "ARTEMIS_BASE_DOMAIN",
  "PORT",
  "DATABASE_URL",
  "REDIS_URL",
  "REDIS_KEY_PREFIX",
  "JWT_SECRET",
  "ACCESS_TOKEN_TTL",
  "REFRESH_TOKEN_TTL",
  "UPLOAD_ROOT"
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `Missing required environment variables${envFile ? ` in ${envFile}` : ""}:`
  );
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log(
  `Required environment variables are present${envFile ? ` in ${envFile}` : ""}.`
);
