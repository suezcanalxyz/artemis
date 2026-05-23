import type { NextFunction, Request, Response } from "express";
import { redis } from "../lib/redis.js";

type LimitOptions = {
  key: (req: Request) => string | null;
  limit: number;
  windowMs: number;
};

async function applyWindow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const min = now - windowMs;
  const tx = redis.multi();
  tx.zremrangebyscore(key, 0, min);
  tx.zcard(key);
  tx.zadd(key, now, `${now}-${Math.random()}`);
  tx.pexpire(key, windowMs);
  const results = await tx.exec();
  const count = results?.[1]?.[1];
  return Number(count ?? 0) + 1;
}

export function rateLimit(options: LimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const baseKey = options.key(req);
    if (!baseKey) {
      next();
      return;
    }

    const count = await applyWindow(baseKey, options.limit, options.windowMs);
    if (count > options.limit) {
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many requests" }
      });
      return;
    }

    next();
  };
}

export const ipRateLimit = rateLimit({
  key: (req) => `ratelimit:ip:${req.ip ?? "unknown"}`,
  limit: 120,
  windowMs: 60_000
});

export const userRateLimit = rateLimit({
  key: (req) => (req.user?.userId ? `ratelimit:user:${req.user.userId}` : null),
  limit: 240,
  windowMs: 60_000
});
