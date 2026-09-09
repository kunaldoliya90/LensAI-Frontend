/**
 * Every non-2xx body from the API is `{ error: { code, message,
 * correlation_id, details } }`. This turns that envelope — and the two failures
 * that never reach the API at all — into one error type the UI can render.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | null;
  readonly details: Record<string, unknown>;
  readonly retryAfterSeconds: number | null;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    correlationId?: string | null;
    details?: Record<string, unknown>;
    retryAfterSeconds?: number | null;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.correlationId = init.correlationId ?? null;
    this.details = init.details ?? {};
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface ValidationDetail {
  loc?: unknown[];
  msg?: string;
}

/**
 * FastAPI reports request-shape failures as `details.errors`, and the template
 * validator reports every fault at once. Both are worth showing in full: a form
 * that reveals its problems one save at a time is the thing this avoids.
 */
export function fieldProblems(error: ApiError): string[] {
  const errors = error.details.errors;
  if (!Array.isArray(errors)) return [];

  return errors.map((entry) => {
    const detail = entry as ValidationDetail;
    const path = Array.isArray(detail.loc) ? detail.loc.filter((p) => p !== "body").join(".") : "";
    const message = detail.msg ?? "is invalid";
    return path ? `${path}: ${message}` : message;
  });
}
