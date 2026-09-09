import { sessionStore } from "@/lib/auth/session";
import { API_ROOT } from "./config";
import { ApiError } from "./errors";

const JSON_TIMEOUT_MS = 30_000;

export type QueryValue = string | number | boolean | undefined | null;

/**
 * The two credentials are mutually exclusive by construction: `x-api-key`
 * reaches the verification API, a session token reaches the portal, and no
 * request may carry both.
 */
type Credential = { auth: "none" | "jwt" } | { auth: "apikey"; apiKey: string };

export type RequestOptions = Credential & {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, QueryValue>;
  json?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

function newCorrelationId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_ROOT}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function authHeaders(credential: Credential): Record<string, string> {
  if (credential.auth === "apikey") return { "x-api-key": credential.apiKey };
  if (credential.auth === "none") return {};

  const session = sessionStore.get();
  if (!session) {
    throw new ApiError({
      status: 401,
      code: "not_authorized",
      message: "Your session has ended. Sign in again to continue.",
    });
  }
  return { Authorization: `Bearer ${session.accessToken}` };
}

async function toApiError(response: Response, fallbackCorrelationId: string): Promise<ApiError> {
  const retryAfter = response.headers.get("Retry-After");
  let code = "internal_error";
  let message = `The API responded with ${response.status}.`;
  let correlationId: string | null = null;
  let details: Record<string, unknown> = {};

  try {
    const body = (await response.json()) as { error?: Record<string, unknown> };
    const envelope = body.error;
    if (envelope) {
      if (typeof envelope.code === "string") code = envelope.code;
      if (typeof envelope.message === "string") message = envelope.message;
      if (typeof envelope.correlation_id === "string") correlationId = envelope.correlation_id;
      if (envelope.details && typeof envelope.details === "object") {
        details = envelope.details as Record<string, unknown>;
      }
    }
  } catch {
    // A gateway or proxy failure need not be JSON. The status still is one.
  }

  return new ApiError({
    status: response.status,
    code,
    message,
    correlationId: correlationId ?? fallbackCorrelationId,
    details,
    retryAfterSeconds: retryAfter ? Number(retryAfter) : null,
  });
}

export interface ApiResponse<T> {
  data: T;
  /** The playground shows 202-new versus 200-idempotent-replay, so it needs this. */
  status: number;
}

export async function apiRequestDetailed<T>(
  path: string,
  options: RequestOptions,
): Promise<ApiResponse<T>> {
  const correlationId = newCorrelationId();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Correlation-ID": correlationId,
    ...authHeaders(options),
    ...options.headers,
  };

  // Multipart deliberately has no Content-Type here: the browser has to set it
  // so that the boundary matches the body it generated.
  if (options.json !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
      signal: AbortSignal.timeout(options.timeoutMs ?? JSON_TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut = cause instanceof DOMException && cause.name === "TimeoutError";
    throw new ApiError({
      status: 0,
      code: timedOut ? "request_timeout" : "network_error",
      message: timedOut
        ? "The request timed out before the API responded."
        : `Could not reach the LensAI API at ${API_ROOT}.`,
      correlationId,
    });
  }

  if (!response.ok) {
    // An expired or rejected session token cannot be refreshed — there is no
    // refresh endpoint — so the only correct response is to end the session.
    if (response.status === 401 && options.auth === "jwt") sessionStore.clear();
    throw await toApiError(response, correlationId);
  }

  if (response.status === 204 || response.headers.get("Content-Length") === "0") {
    return { data: undefined as T, status: response.status };
  }
  return { data: (await response.json()) as T, status: response.status };
}

export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const { data } = await apiRequestDetailed<T>(path, options);
  return data;
}
