import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import { config } from "./config.js";
import { sql } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { redis } from "./lib/redis.js";
import { sentry } from "./lib/sentry.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ipRateLimit } from "./middleware/rateLimit.js";
import { tenantMiddleware } from "./middleware/tenant.js";
import authRoutes from "./routes/auth.js";
import artworkRoutes from "./routes/artworks.js";
import artistRequestRoutes from "./routes/artistRequests.js";
import domainRoutes from "./routes/domains.js";
import internalCaddyRoutes from "./routes/internalCaddy.js";
import opportunityRoutes from "./routes/opportunities.js";
import opportunitySourceRoutes from "./routes/opportunitySources.js";
import onboardingRoutes from "./routes/onboarding.js";
import landingRoutes from "./routes/landing.js";

export function createApp() {
  const app = express();
  void sentry.enabled;
  app.use(cors({ origin: config.WEB_URL }));
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  async function serviceStatus() {
    await sql`select 1`;
    await redis.ping();
    return {
      ok: true,
      services: { database: "ok", redis: "ok" },
      environment: config.NODE_ENV
    };
  }

  app.get(["/health", "/api/health"], async (_req, res, next) => {
    try {
      const data = await serviceStatus();
      res.json({
        data,
        meta: {}
      });
    } catch (error) {
      next(error);
    }
  });
  app.get(["/ready", "/api/ready"], async (_req, res) => {
    try {
      const data = await serviceStatus();
      res.json({
        data,
        meta: {}
      });
    } catch (error) {
      logger.error({ err: error }, "Readiness check failed");
      res.status(503).json({
        data: {
          ok: false,
          services: { database: "error", redis: "error" },
          environment: config.NODE_ENV
        },
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Readiness check failed"
        },
        meta: {}
      });
    }
  });
  app.use(tenantMiddleware);
  if (config.NODE_ENV !== "test" && process.env.PLAYWRIGHT !== "true") {
    app.use(ipRateLimit);
  }
  app.use("/uploads", express.static(path.resolve(config.UPLOAD_ROOT)));
  app.use("/api/auth", authRoutes);
  app.use("/api/artworks", artworkRoutes);
  app.use("/api/artist-requests", artistRequestRoutes);
  app.use("/api/domains", domainRoutes);
  app.use("/api/opportunities", opportunityRoutes);
  app.use("/api/opportunity-sources", opportunitySourceRoutes);
  app.use("/api/onboarding", onboardingRoutes);
  app.use("/api/landing", landingRoutes);
  app.use("/internal/caddy", internalCaddyRoutes);

  if (config.NODE_ENV === "production") {
    const webDistRoot = path.resolve(process.cwd(), "dist", "web");
    const indexHtml = path.join(webDistRoot, "index.html");

    if (fs.existsSync(indexHtml)) {
      app.use(express.static(webDistRoot));
      app.get("*", (req, res, next) => {
        if (
          req.path.startsWith("/api/") ||
          req.path.startsWith("/internal/") ||
          req.path.startsWith("/uploads/")
        ) {
          next();
          return;
        }

        res.sendFile(indexHtml);
      });
    } else {
      logger.warn(
        { webDistRoot },
        "Production web build not found; frontend assets are not being served"
      );
    }
  }

  app.use(errorHandler);
  return app;
}
