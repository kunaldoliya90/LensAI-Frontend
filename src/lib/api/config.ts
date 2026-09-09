const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000").replace(
  /\/+$/,
  "",
);

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1";

/** Every API call hangs off this. */
export const API_ROOT = `${API_ORIGIN}${API_PREFIX}`;

/** FastAPI's generated OpenAPI browser — the authority on request shapes. */
export const API_DOCS_URL = `${API_ORIGIN}/docs`;
