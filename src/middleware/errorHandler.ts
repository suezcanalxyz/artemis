import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { sentry } from "../lib/sentry.js";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  void next;
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION",
        message: "Validation failed",
        fields: Object.fromEntries(
          error.issues.map((issue) => [issue.path.join("."), issue.message])
        )
      }
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, fields: error.fields }
    });
    return;
  }

  logger.error({ err: error }, "Unhandled error");
  sentry.captureException(error);
  res.status(500).json({
    error: { code: "INTERNAL", message: "Internal server error" }
  });
}
