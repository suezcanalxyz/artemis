import type { NextFunction, Request, Response } from "express";
import { authRequired } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/sessionTokens.js";

export function attachAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      profileId: payload.profileId,
      email: payload.email
    };
  } catch {
    req.user = undefined;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  attachAuth(req, res, (error?: unknown) => {
    if (error) {
      next(error);
      return;
    }

    if (!req.user) {
      next(authRequired());
      return;
    }
    next();
  });
}
