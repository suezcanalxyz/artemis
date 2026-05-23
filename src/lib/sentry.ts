import * as Sentry from "@sentry/node";
import { config } from "../config.js";

const enabled = config.NODE_ENV === "production" && Boolean(config.SENTRY_DSN);

if (enabled) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV
  });
}

export const sentry = {
  enabled,
  captureException(error: unknown) {
    if (enabled) Sentry.captureException(error);
  }
};
