export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}

export const notFound = (message = "Resource not found") =>
  new AppError(404, "NOT_FOUND", message);

export const authRequired = () =>
  new AppError(401, "AUTH_REQUIRED", "Authentication required");

export const forbidden = (message = "Forbidden") =>
  new AppError(403, "FORBIDDEN", message);

export const conflict = (message: string) =>
  new AppError(409, "CONFLICT", message);

export const validationError = (
  message: string,
  fields?: Record<string, string>
) => new AppError(400, "VALIDATION", message, fields);
