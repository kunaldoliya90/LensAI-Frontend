/**
 * Wire types for the LensAI API, mirroring `app/api/v1/schemas/*` in the
 * backend. Decimal-typed fields arrive as strings, not numbers.
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";
/** What an ADMIN account can be granted. SUPER_ADMIN has all of these
 * implicitly — it is never itself stored as a permission. Curating the
 * nature catalog is not on this list on purpose: it affects every tenant at
 * once, so it is reserved to SUPER_ADMIN rather than a grantable scope. */
export type Permission = "tenants" | "api_keys" | "usage";
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "ERRORED" | "CANCELLED";
export type Verdict = "PASS" | "FAIL" | "PARTIAL" | "NOT_SPECIFIED";
export type MatchStatus = "MATCH" | "MISMATCH" | "NOT_SPECIFIED" | "NOT_VERIFIABLE";
export type Severity = "mandatory" | "advisory" | "disabled";
export type StepStatus = "OK" | "FAILED" | "SKIPPED";
export type ExtractionStrategy = "auto" | "text_layer" | "vision" | "ocr_text";
export type NatureStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type ApiKeyStatus = "PENDING" | "ACTIVE" | "REVOKED" | "EXPIRED";
export type ApiKeyEnvironment = "SANDBOX" | "PRODUCTION";
export type TenantStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type ProviderStatus = "ACTIVE" | "INACTIVE" | "UNHEALTHY";
export type ProviderAdapter = "azure_openai" | "openai" | "openai_compatible";
export type DataPolicy = "STRICT" | "ALLOW_PLATFORM_FALLBACK";
export type WebhookStatus = "PENDING" | "IN_FLIGHT" | "RETRYING" | "SUCCESS" | "FAILED";
export type WebhookEvent = "verification.completed" | "verification.failed";
export type RateLimitTier = "sandbox" | "standard" | "high" | "unlimited";

export const WEBHOOK_EVENTS: readonly WebhookEvent[] = [
  "verification.completed",
  "verification.failed",
];

/** A template-level decision, not a plugin parameter: how a failure is treated. */
export const SEVERITIES: readonly Severity[] = ["mandatory", "advisory", "disabled"];

export const RATE_LIMIT_TIERS: readonly RateLimitTier[] = [
  "sandbox",
  "standard",
  "high",
  "unlimited",
];

export const ALL_PERMISSIONS: readonly Permission[] = ["tenants", "api_keys", "usage"];

export const PERMISSION_LABELS: Record<Permission, string> = {
  tenants: "Tenants & clients",
  api_keys: "API keys",
  usage: "Platform usage",
};

/** Requests per minute per key. `unlimited` disables the check entirely. */
export const RATE_LIMIT_PER_MINUTE: Record<RateLimitTier, number | null> = {
  sandbox: 60,
  standard: 600,
  high: 3000,
  unlimited: null,
};

// --- Auth -----------------------------------------------------------------

export interface SessionResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  tenant_id: string;
  user_id: string;
  email: string;
  role: UserRole;
  /** Empty for a USER. Every scope, for a SUPER_ADMIN. */
  permissions: Permission[];
}

export interface WhoAmIResponse {
  tenant_id: string;
  api_key_id: string;
  environment: ApiKeyEnvironment;
  rate_limit_tier: string;
}

// --- Clients --------------------------------------------------------------

export interface ClientSummary {
  client_id: string;
  tenant_id: string;
  name: string;
  contact_email: string | null;
  created_at: string;
}

// --- API keys -------------------------------------------------------------

export interface ApiKeySummary {
  api_key_id: string;
  tenant_id: string;
  name: string;
  key_prefix: string;
  environment: ApiKeyEnvironment;
  status: ApiKeyStatus;
  rate_limit_tier: string;
  created_at: string;
  approved_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  last_used_at: string | null;
}

export interface ApiKeyIssued extends ApiKeySummary {
  plaintext_key: string;
  message: string;
}

export interface PendingApiKey extends ApiKeySummary {
  tenant_name: string;
}

export interface TenantStatusResult {
  tenant_id: string;
  previous_status: TenantStatus;
  status: TenantStatus;
  cache_ttl_seconds: string;
}

// --- Staff / platform administration ---------------------------------------

export interface TenantSummary {
  tenant_id: string;
  name: string;
  status: TenantStatus;
  created_at: string;
}

/** A client, named with the tenant it belongs to — staff have no client list
 * of their own, only ever someone else's. */
export interface ClientWithTenant {
  client_id: string;
  tenant_id: string;
  tenant_name: string;
  name: string;
  contact_email: string | null;
  created_at: string;
}

export interface AdminSummary {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  permissions: Permission[];
  created_at: string;
  last_login_at: string | null;
}

export interface PlaygroundSessionIssued {
  client_id: string;
  api_key: string;
  message: string;
}

// --- Webhooks -------------------------------------------------------------

export interface WebhookEndpointSummary {
  endpoint_id: string;
  client_id: string;
  url: string;
  description: string | null;
  events: string[];
  is_active: boolean;
  previous_secret_expires_at: string | null;
  created_at: string;
}

export interface WebhookEndpointCreated {
  endpoint_id: string;
  client_id: string;
  url: string;
  events: string[];
  is_active: boolean;
  signing_secret: string;
}

export interface WebhookSecretRotated {
  endpoint_id: string;
  signing_secret: string;
  previous_secret_expires_at: string;
}

export interface DeliverySummary {
  log_id: string;
  verification_id: string;
  event_id: string;
  event_type: string;
  sequence: number;
  status: WebhookStatus;
  attempts: number;
  http_status_code: number | null;
  error_message: string | null;
  webhook_url: string;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  created_at: string;
}

// --- Natures (document types) and reference data --------------------------

/** A document type, platform-curated — see `NatureAdminService` in the
 * backend. `code` is the wire value sent as `nature` (a caller-facing int,
 * assigned once and never reassigned); `key` is the internal identifier used
 * everywhere else in the console; `label` is the human display name. */
export interface NatureVersion {
  nature_id: string;
  code: number;
  key: string;
  label: string;
  version: number;
  status: NatureStatus;
  config: Record<string, unknown>;
  created_at: string;
}

export interface NatureValidation {
  valid: boolean;
  problems: string[];
  /** Faults that do not block the save — chiefly a param the plugin never reads. */
  warnings: string[];
}

/**
 * The plugin catalog, from `GET /portal/plugins`.
 *
 * The console deliberately holds no list of plugin names, parameters or field
 * types of its own: a check added to the backend has to appear in the builder
 * without a frontend release, so everything below is read at runtime.
 */
export type ParamType = "string" | "text" | "number" | "integer" | "boolean" | "string[]";
export type PluginKind = "check" | "integrity" | "extractor";

export interface ParamSpec {
  /** May be dotted — `render.dpi` addresses `render: { dpi }`. */
  key: string;
  type: ParamType;
  label: string;
  help: string;
  default: unknown;
  /** Non-empty means render a select. */
  choices: string[];
  minimum: number | null;
  maximum: number | null;
  advanced: boolean;
}

export interface Plugin {
  name: string;
  kind: PluginKind;
  version: string;
  title: string;
  summary: string;
  params: ParamSpec[];
  uses_llm: boolean;
  /** Field types this check is meaningful for. Empty means any. */
  value_types: string[];
  reference_data_key: string | null;
}

export interface FieldType {
  key: string;
  label: string;
  summary: string;
  /** Set alongside `type` on the field itself, not under `params`. */
  options: ParamSpec[];
}

export interface PluginCatalogue {
  extractors: Plugin[];
  integrity: Plugin[];
  checks: Plugin[];
  field_types: FieldType[];
  verdict_policy_rules: ParamSpec[];
}

export interface ReferenceDataSummary {
  reference_data_id: string;
  key: string;
  version: number;
  description: string | null;
  entry_count: number;
  created_at: string;
}

export interface ReferenceDataDetail extends ReferenceDataSummary {
  mapping: Record<string, unknown>;
}

// --- AI providers ---------------------------------------------------------

export interface ProviderSummary {
  provider_id: string;
  name: string;
  adapter: string;
  model: string;
  status: ProviderStatus;
  config: Record<string, unknown>;
  last_health_check_at: string | null;
  last_health_ok: boolean | null;
  last_health_error: string | null;
  created_at: string;
}

export interface ProviderRegistered {
  provider: ProviderSummary;
  health_ok: boolean;
  health_error: string | null;
}

export interface RoutingSummary {
  data_policy: DataPolicy;
  default_provider_id: string | null;
  providers: ProviderSummary[];
}

// --- Usage ----------------------------------------------------------------

export interface UsageLine {
  usage_date: string;
  provider_scope: string;
  template_key: string;
  verifications: number;
  documents: number;
  pages: number;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  failed_attempt_tokens: number;
  tenant_id: string | null;
  tenant_name: string | null;
}

export interface UsageReport {
  period_start: string;
  period_end: string;
  lines: UsageLine[];
  totals: UsageLine | null;
}

// --- Documents ------------------------------------------------------------

export interface DocumentUploaded {
  document_id: string;
  client_id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  uploaded_at: string;
  expires_at: string;
}

// --- Verifications --------------------------------------------------------

export type DocumentInput =
  | { type: "url"; url: string; file_name?: string; doc_type?: string }
  | { type: "document_id"; document_id: string; file_name?: string; doc_type?: string };

export interface VerificationSubmit {
  reference_id: string;
  client_id: string;
  /** A nature's `code` (see `NatureAvailable`), not its name. */
  nature: number;
  documents: DocumentInput[];
  expected_values?: Record<string, unknown>;
  callback_url?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface NatureRef {
  code: number;
  name: string;
  version: number;
}

export interface VerificationAccepted {
  verification_id: string;
  reference_id: string;
  job_status: JobStatus;
  nature: NatureRef;
  estimated_completion_seconds: number;
  warnings: string[];
}

export interface CheckResult {
  field_name: string;
  check_plugin: string;
  expected_value: string | null;
  extracted_value: string | null;
  match_status: MatchStatus;
  severity: string;
  confidence: string | null;
  remarks: string | null;
}

export interface VerificationResult {
  verification_id: string;
  reference_id: string;
  client_id: string;
  nature: NatureRef;
  job_status: JobStatus;
  verdict: Verdict | null;
  verdict_reason: string | null;
  confidence_score: string | null;
  failure_reason: string | null;
  extracted_fields: Record<string, unknown> | null;
  expected_values: Record<string, unknown>;
  checks: CheckResult[];
  extraction_strategy: ExtractionStrategy | null;
  attempt_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
}

export interface VerificationSummary {
  verification_id: string;
  reference_id: string;
  client_id: string;
  job_status: JobStatus;
  verdict: Verdict | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationPage {
  items: VerificationSummary[];
  next_cursor: string | null;
}

export interface StepResult {
  stage: string;
  plugin_name: string;
  plugin_version: string;
  sequence: number;
  status: StepStatus;
  severity: Severity;
  duration_ms: number;
  started_at: string;
  data: Record<string, unknown> | null;
  error: string | null;
}

export interface StageLatency {
  stage: string;
  steps: number;
  duration_ms: number;
}

export interface VerificationTrace {
  verification_id: string;
  total_duration_ms: number;
  by_stage: StageLatency[];
  steps: StepResult[];
}

export interface ExpectedField {
  key: string;
  /** Human label from the nature. Show this, not `key`. */
  label: string;
  type: string;
  format: string | null;
  hint: string | null;
}

/** GET /v1/natures and GET /portal/natures — what you can submit against. */
export interface NatureAvailable {
  /** What you pass as `nature` when you submit against this type. */
  code: number;
  name: string;
  label: string;
  version: number;
  expects: string[];
  /** The same keys with their label and type, in the nature's own order. */
  fields: ExpectedField[];
}
