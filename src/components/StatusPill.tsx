import { Pill, type Tone } from "@/components/ui/Pill";

/**
 * One map for every status the API returns. The values that appear in more
 * than one enum — ACTIVE, PENDING, FAILED — mean the same thing in each, so a
 * single table keeps them from drifting into different colours per page.
 */
const TONES: Record<string, Tone> = {
  // job_status
  QUEUED: "neutral",
  PROCESSING: "warn",
  COMPLETED: "info",
  ERRORED: "fail",
  CANCELLED: "neutral",
  // verdict
  PASS: "pass",
  FAIL: "fail",
  PARTIAL: "warn",
  NOT_SPECIFIED: "neutral",
  // match_status
  MATCH: "pass",
  MISMATCH: "fail",
  NOT_VERIFIABLE: "warn",
  // api key, template, provider, tenant lifecycle
  PENDING: "warn",
  ACTIVE: "pass",
  INACTIVE: "neutral",
  REVOKED: "fail",
  EXPIRED: "neutral",
  DRAFT: "neutral",
  UNHEALTHY: "fail",
  SUSPENDED: "fail",
  SANDBOX: "neutral",
  PRODUCTION: "info",
  // webhook delivery
  IN_FLIGHT: "warn",
  RETRYING: "warn",
  SUCCESS: "pass",
  FAILED: "fail",
  // pipeline steps
  OK: "pass",
  SKIPPED: "neutral",
  // data policy
  STRICT: "pass",
  ALLOW_PLATFORM_FALLBACK: "warn",
};

export function StatusPill({ value, label }: { value: string | null | undefined; label?: string }) {
  if (!value) return <span className="text-ink-subtle">—</span>;

  return <Pill tone={TONES[value] ?? "neutral"}>{label ?? value.replace(/_/g, " ")}</Pill>;
}
