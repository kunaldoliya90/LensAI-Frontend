export type JsonObjectResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Both the template config and a reference-data mapping must be a JSON object,
 * and the editor has to say which of the two things went wrong before anything
 * is sent to the API.
 */
export function parseJsonObject(text: string): JsonObjectResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Invalid JSON." };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "The top level must be a JSON object." };
  }

  return { ok: true, value: parsed as Record<string, unknown> };
}
