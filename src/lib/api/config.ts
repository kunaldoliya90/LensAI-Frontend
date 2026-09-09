/**
 * Where the API lives.
 *
 * Both variables are inlined into the client bundle at BUILD time, so a
 * deployment reads whatever they were when it was built — editing them on the
 * host and not rebuilding changes nothing.
 *
 * `||` rather than `??` on purpose. A build platform can hand a declared-but-
 * unset variable through as an empty string rather than leaving it undefined,
 * and `??` only catches null and undefined — so an empty value would win and
 * `API_ROOT` would collapse to a path relative to whatever origin served the
 * page. Every call then 404s against the frontend's own host, which looks
 * nothing like a misconfiguration. Treating empty as absent fails loudly on
 * localhost instead.
 */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(
  /\/+$/,
  "",
);

/**
 * Normalised to a leading slash. Without this, a prefix entered as `api/v1`
 * concatenates into `https://host.exampleapi/v1` — a hostname that cannot
 * resolve, reported as a network error rather than as the typo it is.
 */
const rawPrefix = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1";
const API_PREFIX = rawPrefix.startsWith("/") ? rawPrefix : `/${rawPrefix}`;

/** Every API call hangs off this. */
export const API_ROOT = `${API_ORIGIN}${API_PREFIX.replace(/\/+$/, "")}`;

/** FastAPI's generated OpenAPI browser — the authority on request shapes. */
export const API_DOCS_URL = `${API_ORIGIN}/docs`;
