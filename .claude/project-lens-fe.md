# LensAI website & console — frontend generation specification

**Audience:** a coding agent (Claude, Cursor, etc.) generating the entire frontend in one pass.  
**Backend this document is bound to:** LensAI-Backend as of the `app/api/v1` surface.  
**How to use:** treat this file as the product + technical source of truth. If OpenAPI (`GET /docs` on the API) disagrees with a field name, **OpenAPI wins for shapes**; this file wins for **which screens exist, copy, UX rules, and which credential each call uses**. Do not invent endpoints. Do not collapse `job_status` and `verdict`. Do not build a “forgot password” or “refresh token” flow — the API has neither.

Generate **one website**: public marketing + documentation + authenticated tenant console + LensAI staff admin. Same design system. Role-gated routes.

---

## 0. Product in one paragraph

LensAI is a **multi-tenant document verification API**. A customer’s *backend* submits a document plus the values they believe it contains. LensAI extracts, compares, and returns a **verdict**. The result is pushed as a **signed webhook**; it is always also available via `GET /api/v1/verifications/{id}`. LensAI **never** connects to the customer’s database. The join key is their `reference_id`.

This frontend is the **human surface** around that API: explain the product, let a company sign up, issue API keys (pending LensAI approval), configure clients / webhooks / templates / BYOM, inspect usage and deliveries, and (with a stored API key) try a verification in a playground. Integrators still integrate from *their* servers; the console is not a replacement for the API.

---

## 1. Goals and non-goals

### Goals

- A complete, production-looking site a real compliance team would trust.
- Every backend capability that a human can use is reachable in the UI.
- Secrets shown **once** (API keys, webhook signing secrets) with copy-to-clipboard and a blocking “I have stored this” step.
- Errors use the API envelope (`error.code`, `error.message`, `error.correlation_id`) and never a generic “Something went wrong” as the only text.
- Docs that teach the **three webhook rules**, upload vs URL, idempotency, and verdict semantics.

### Non-goals (do not build)

- User invite / multi-user management per tenant (API has signup of one first user only; no invite endpoint).
- Password reset, email verification, OAuth, SSO, 2FA (no endpoints).
- Refresh tokens (JWT TTL is `expires_in` seconds, typically 3600; on 401 `not_authorized` / invalid token, send the user to login).
- Serving or previewing raw document bytes (GET document returns metadata only).
- Editing a template **in place** (save always creates a new version).
- Retrieving an API key or webhook secret after the create/rotate response.
- A public job board or any unauthenticated access to tenant data.
- Connecting to the customer’s database from the browser.
- Real-time websockets (poll GET verification / deliveries).

### Explicit backend gap (design around it)

There is **no JWT portal endpoint to list or get verifications**. Job intake and results are **`x-api-key` only**. The console therefore has:

- **Usage** and **webhook deliveries** (JWT) as the operational views that always work after login.
- A **Playground** that uses an API key the user pastes (kept only in the browser; never written to LensAI’s database). Playground calls `/documents` and `/verifications*` with `x-api-key`.

Do not fake a jobs table from JWT. Do not call verification routes with `Authorization: Bearer`.

---

## 2. Personas

| Persona | Auth | What they do on this site |
|---|---|---|
| **Visitor** | None | Landing, about, docs, pricing-style “how it works”, signup/login. |
| **Tenant operator** (`role: USER`) | JWT | Company console: clients, keys, webhooks, templates, reference data, AI providers, usage, deliveries, playground. |
| **Integrator** | API key (in playground or their own app) | Same as operator, plus they copy keys/secrets into their backend. Docs are written for them. |
| **LensAI staff** (`role: ADMIN`) | JWT + admin routes | Approval queue for API keys, suspend tenants, usage across tenants. Staff still have `tenant_id` on the session; they use `/api/v1/admin/*` for platform actions. |

`role` comes from `POST /portal/signup` and `POST /portal/login` (`SessionResponse.role`). Re-check on every navigation that needs it; the API re-reads role from the database per request, so a demotion takes effect on the next call.

---

## 3. Brand, voice, visual system

**Name:** LensAI  
**Category:** Document verification / compliance infrastructure.  
**Voice:** Precise, calm, adult. Short sentences. Explain *why* a rule exists (idempotency, STRICT policy, NOT_SPECIFIED). No startup hype, no emojis, no gradients, no glassmorphism, no “AI sparkles.”

**Visual**

- Light marketing pages; console can be light with a dense layout (tables, not cards-for-everything).
- Typography: one sans for UI (e.g. Inter or IBM Plex Sans), one tabular/mono for IDs, keys, JSON, correlation ids.
- Color: near-black text, off-white ground, **one** accent (deep blue or ink teal) for primary buttons and links. Semantic colors only for status: green PASS, red FAIL, amber PARTIAL / PENDING, neutral NOT_SPECIFIED / QUEUED.
- Radius 6–8px. 1px borders. No drop shadows.
- Max content width ~1120px marketing; console uses full width with a 240px sidebar.

**Accessibility:** contrast AA, visible focus, labels on every input, don’t convey status by color alone (use text + optional pill).

---

## 4. Suggested stack (generate this unless the user named another)

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** with a small token file (`colors`, `radius`, `font`)
- **TanStack Query** for server state
- **React Hook Form + Zod** mirroring the request models below
- **Monaco or CodeMirror** for template JSON and reference-data JSON
- Cookie or `sessionStorage` for JWT (see §8). **Never** put the API key in a cookie sent to the Next.js origin by default; playground key stays in `sessionStorage` under a dedicated key.

Environment:

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
```

All browser calls go to `{NEXT_PUBLIC_API_BASE_URL}{NEXT_PUBLIC_API_PREFIX}/...` except health (`{BASE}/health/live`). CORS on the API currently defaults to `*`; still send `Origin` correctly in production and list the real site origin in API `cors_origins`.

---

## 5. Information architecture (routes)

Public:

| Path | Page |
|---|---|
| `/` | Landing |
| `/about` | About / company |
| `/docs` | Docs hub |
| `/docs/quickstart` | First key, first upload, first verification |
| `/docs/authentication` | `x-api-key` vs JWT; whoami |
| `/docs/uploading` | Upload vs URL, formats, retention |
| `/docs/verifications` | Submit body, idempotency, poll vs webhook |
| `/docs/webhooks` | Signature, events, retry, replay |
| `/docs/verdicts` | job_status vs verdict; NOT_SPECIFIED |
| `/docs/templates` | Config shape, plugins, versioning |
| `/docs/byom` | Bring your own model, STRICT |
| `/docs/errors` | Envelope + code catalog |
| `/docs/api-reference` | Table of every route (this spec §14) plus link to FastAPI `/docs` |
| `/signup` | Create tenant + first user |
| `/login` | Session |

Authenticated tenant (`role` USER or ADMIN; layout with sidebar):

| Path | Page |
|---|---|
| `/app` | Dashboard home |
| `/app/clients` | List + create clients |
| `/app/keys` | API keys |
| `/app/webhooks` | Endpoints per client |
| `/app/deliveries` | Webhook delivery history + replay |
| `/app/templates` | Versions, validate, save, activate/retire |
| `/app/templates/[name]` | Editor for one template name |
| `/app/reference-data` | Lookup tables |
| `/app/reference-data/[key]` | Detail + new version |
| `/app/ai` | Providers, default, data policy, health |
| `/app/usage` | Usage report |
| `/app/playground` | Paste API key; upload; submit; poll result + steps |
| `/app/settings` | Who is logged in (from session); no password change API |

Staff only (`role === "ADMIN"`):

| Path | Page |
|---|---|
| `/staff` | Admin home |
| `/staff/keys` | Approval queue (filter by status) |
| `/staff/tenants` | Suspend / reactivate (need tenant_id; from queue rows + usage report) |
| `/staff/usage` | Cross-tenant usage |

Redirects:

- Logged-in user hitting `/login` or `/signup` → `/app`
- Unauthenticated `/app/*` → `/login?next=`
- Non-admin `/staff/*` → `/app` with a toast “Administrator only”
- 403 `tenant_suspended` → dedicated `/suspended` page (message from API)

---

## 6. Global UX contracts (must implement)

### 6.1 Error envelope

Every non-2xx JSON body from the API:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "human readable",
    "correlation_id": "…",
    "details": {}
  }
}
```

UI: show `message` as the primary text. Show `code` and `correlation_id` in muted mono so support can find the log line. Map codes:

| code | HTTP | UI treatment |
|---|---|---|
| `missing_api_key` / `invalid_api_key` | 401 | Playground: “API key missing or unrecognized.” |
| `api_key_pending_approval` | 403 | “This key is waiting for LensAI approval.” Link to `/app/keys`. |
| `api_key_revoked` / `api_key_expired` | 403 | Distinct copy. |
| `tenant_suspended` | 403 | Full-page suspended. |
| `not_authorized` | 403 | Staff routes or inactive user → login. |
| `rate_limited` | 429 | Honor `Retry-After`. |
| `idempotency_key_reused` | 422 | “This Idempotency-Key was used with a different body.” |
| `request_in_flight` | 409 | “Original request still processing — wait and retry GET.” |
| `document_too_large` | 413 | “Max 50 MB.” |
| `unsafe_url` | 422 | “URL is not publicly fetchable (SSRF guard).” |
| `template_not_found` / `template_inactive` | 404/422 | Point to Templates. |
| FastAPI 422 | 422 | Field errors from `details` / validation array. |

Always send `X-Correlation-ID` if you have one; display the one returned.

### 6.2 Secret-once pattern

Used for: `plaintext_key`, `signing_secret`.

1. Modal, not a toast.
2. Secret in a mono field, copy button, optional download `.txt`.
3. Checkbox: “I have stored this secret. LensAI cannot show it again.”
4. Primary button disabled until checked.
5. After close, the list view shows only `key_prefix` / URL, never the secret.

Rotate webhook secret: same modal; show `previous_secret_expires_at` and explain dual `v1` signatures for 24 hours.

### 6.3 Status pills

**Job status:** QUEUED, PROCESSING, COMPLETED, ERRORED, CANCELLED.  
**Verdict:** PASS, FAIL, PARTIAL, NOT_SPECIFIED — only meaningful when `job_status === COMPLETED`. Never display a verdict on ERRORED (use `failure_reason`).  
**API key:** PENDING, ACTIVE, REVOKED, EXPIRED.  
**Provider:** ACTIVE, INACTIVE, UNHEALTHY.  
**Template:** DRAFT, ACTIVE, INACTIVE.  
**Webhook delivery:** PENDING, IN_FLIGHT, RETRYING, SUCCESS, FAILED.

### 6.4 Dates

ISO-8601 from API. Display in the user’s locale, keep UTC in tooltips. Date-only usage filters are `YYYY-MM-DD` query params `from` and `to`.

---

## 7. Page-by-page product spec

### 7.1 Landing `/`

**Purpose:** Convert a compliance/engineering lead into a signup.

**Sections (in order):**

1. **Nav:** Logo, Product, Docs, About, Log in, **Get started** (primary).
2. **Hero:** Headline: “Verify documents. Write the verdict in *your* database.” Sub: “Submit a file and the values you expect. LensAI extracts, compares, and POSTs a signed result. We never touch your DB.” CTAs: Get started, Read the docs.
3. **How it works (3 steps):** Upload or URL → queued job (202) → webhook `verification.completed` / poll GET.
4. **Why not a hosted PDF viewer:** evidence stays for a retention window; verdicts survive; no public challan URL required.
5. **Trust row:** signed webhooks (HMAC), RLS multi-tenant API, STRICT BYOM (documents never hit the platform model if they bring their own).
6. **Verdict legend:** PASS / FAIL / PARTIAL / NOT_SPECIFIED with the NOT_SPECIFIED warning (unreadable ≠ pass).
7. **Footer:** Docs, About, Login, API status (optional `GET /health/live`).

Do not promise SLA numbers the backend does not publish.

### 7.2 About `/about`

- What LensAI is (verification infrastructure, not a document CMS).
- Model A: webhook into the customer’s system.
- Multi-tenant, API-key environments SANDBOX vs PRODUCTION.
- BYOM and data policy in plain language.
- No fake team bios. If you lack real company facts, keep this short and accurate.

### 7.3 Docs

Write **real pages**, not “coming soon.” Source material already exists in `docs/integration/` of the backend repo — port that content into the site IA above. Include copy-paste curl and a Node/Python snippet for signature verification:

- Header `X-LensAI-Signature`: `t=<unix>,v1=<hex>[,v1=<hex>]`
- Signed payload: `{timestamp}.{raw_body_bytes}` HMAC-SHA256
- Also send/read `X-LensAI-Event-Id`, `X-LensAI-Event-Type`, `X-LensAI-Delivery-Attempt`
- Deduplicate on `event_id`
- Ack 2xx within 10 seconds
- 4xx (except 408/429) dead-letters; portal can replay; **replay keeps the same `event_id`**

Docs nav is a left sidebar. Code samples use `x-api-key` for verification routes and `Authorization: Bearer` for portal.

### 7.4 Signup `/signup`

Fields (exact API):

- `company_name` (1–255)
- `name` (1–255)
- `email`
- `password` (min 12 characters; show requirement; SecretStr — send as JSON string)

`POST /api/v1/portal/signup` → 201 `SessionResponse`. Persist session (§8). Redirect `/app`.

Empty/error: duplicate email → show API message.

### 7.5 Login `/login`

`email`, `password`. `POST /api/v1/portal/login` → `SessionResponse`. Redirect `next` or `/app`.

### 7.6 App shell

Left nav groups:

- Overview
- Work: Playground
- Setup: Clients, API keys, Webhooks, Templates, Reference data, AI providers
- Operate: Deliveries, Usage
- Staff (if ADMIN): Approval queue, Tenants, Platform usage

Header: company context (email + role), Log out (clear JWT + playground key).

### 7.7 Dashboard `/app`

Widgets (real data only):

- Session: email, role, tenant_id (copyable).
- Counts: number of clients, keys by status (from list endpoints).
- Usage spark/summary: current month from `GET /portal/usage` (totals line).
- Recent deliveries: last 10 from `GET /portal/webhooks/deliveries`.
- CTA if no clients: “Create a client — every job and webhook hangs off a client_id.”
- CTA if no ACTIVE key: “Request a key; a LensAI admin must approve it before it authenticates.”

### 7.8 Clients `/app/clients`

- Table: name, client_id, contact_email, created_at.
- Create modal: `name`, optional `contact_email`. `POST /portal/clients`.
- Copy `client_id` — it is required on uploads, verifications, webhooks.

No delete/update API — do not draw edit/delete.

### 7.9 API keys `/app/keys`

- List: name, `key_prefix`, environment, status, tier, created, approved, expires, last_used.
- Create: `name`, `environment` SANDBOX | PRODUCTION. Response `ApiKeyIssued` → secret-once modal. Status will be **PENDING**.
- Revoke: `POST /portal/api-keys/{id}/revoke` with required `reason` (1–500). Confirm dialog.

Explain: sandbox vs production is an attribute on the key; pending keys return `api_key_pending_approval` on API calls.

### 7.10 Webhooks `/app/webhooks`

Must select a **client** first (`client_id` is required on list and create).

- List: url, events (empty means all), active, created.
- Create: url (HTTPS), description, events multi-select: `verification.completed`, `verification.failed` (empty = all). Secret-once.
- Rotate: `POST /portal/webhooks/{endpoint_id}/rotate-secret`.

SSRF: private URLs are rejected in production. Dev may allow private destinations — if create fails with unsafe URL, show that message.

### 7.11 Deliveries `/app/deliveries`

`GET /portal/webhooks/deliveries?reference_id=&status=&limit=` (limit 1–200, default 50).

Columns: created, event_type, event_id, status, attempts, http_status, webhook_url, error, next_retry, verification_id.

**Replay:** `POST /portal/webhooks/deliveries/{log_id}/replay` → 202. Banner: “Replay uses the same event_id. Your consumer must be idempotent.”

No payload in this list (by design). Link “Open in playground” only if a playground API key is present (then GET verification).

### 7.12 Templates `/app/templates` and editor

- List all versions (active and not): name, version, status, created.
- Validate: `POST /portal/templates/validate` `{ config }` → `{ valid, problems[] }` — show **all** problems.
- Save: `PUT /portal/templates/{name}` `{ config, activate }` → always **new version**. Name is the path param (e.g. `challan`).
- Status: `POST /portal/templates/{name}/status` `{ version, status }` DRAFT | ACTIVE | INACTIVE.

Editor: JSON with the canonical challan example preloaded as “Insert example” (full `CHALLAN_TEMPLATE` from backend seed — include extraction.fields, integrity[], checks[], verdict_policy). Document in the UI:

- `extraction.plugin` must be `extractor.generic` (currently the only extractor).
- Each check `field` must exist in `extraction.fields[].key`.
- Plugins:  
  extract: `extractor.generic`  
  integrity: `integrity.blank_page`, `integrity.pdf_overlay`, `integrity.metadata`  
  checks: `check.fuzzy_text`, `check.date_equals`, `check.numeric_equals`, `check.period_match`, `check.state_match`, `check.authority_match`

Do not ship a broken visual builder in v1 if it cannot round-trip JSON. A validated JSON editor is correct.

### 7.13 Reference data

- List latest per key: key, version, entry_count, description.
- Get: `GET /portal/reference-data/{key}?version=`
- Save: `PUT /portal/reference-data/{key}` `{ mapping, description }` — **new version**.
- Explain: templates opt in with `"reference_data": "authority_map"` (or the key they uploaded). Built-in defaults exist if a check does not name a table.

`mapping` is JSON object; editor as JSON.

### 7.14 AI providers `/app/ai`

- Banner for **data policy**: STRICT (default) vs ALLOW_PLATFORM_FALLBACK. Toggle via `PUT /portal/ai-providers/data-policy`. Confirm dialog on switching **to** fallback: “Documents may reach the platform model if yours is down.”
- List + routing: `GET /portal/ai-providers` → `data_policy`, `default_provider_id`, `providers[]`.
- Register: name, adapter (`azure_openai` | `openai` | `openai_compatible`), model, api_key (optional), config JSON.  
  Config hints: `endpoint` or `base_url`, `api_version` (Azure), `timeout_s`, capabilities.  
  Response includes `health_ok` / `health_error` inline — show UNHEALTHY clearly.
- Health check, set default (204), disable (204, not delete).

Never display api_key after submit.

### 7.15 Usage `/app/usage`

`GET /portal/usage?from=&to=&by_template=` (booleans as `true`/`false`).

Default current month. Table + totals. Split **PLATFORM vs TENANT** scopes in the UI: tenant-scope tokens are “billed by your provider, shown here to reconcile.” Call out `failed_attempt_tokens`.

### 7.16 Playground `/app/playground`

The only console page that uses **`x-api-key`**.

1. API key field (password input), stored in `sessionStorage` (`lensai.playgroundApiKey`). “Test whoami” → `GET /portal/whoami` with the key → show tenant_id, environment, tier.
2. Client select (from JWT `GET /portal/clients`).
3. **Upload:** multipart `file`, `client_id`, optional `doc_type`. Accept PDF/PNG/JPEG/WebP. Show sha256, expires_at. 413/422 handling.
4. **Submit verification:**  
   - `reference_id` (required)  
   - `template` (from `GET /templates` **with the API key**, not JWT portal templates list — portal list is all versions; API list is what can be submitted and includes `expects[]`)  
   - documents: uploaded id and/or URL  
   - `expected_values` dynamic fields from `expects`  
   - optional `Idempotency-Key` header (default to reference_id)  
   - optional callback_url, metadata JSON  
   Show 202 vs 200 (replay).
5. Poll `GET /verifications/{id}` every 2s while QUEUED/PROCESSING. Then show verdict, checks table, extracted vs expected.
6. **Trace:** `GET /verifications/{id}/steps` — stages slowest-first + step table.
7. List: `GET /verifications?limit=&cursor=&job_status=&reference_id=&updated_since=`
8. Cancel: only if QUEUED.

If whoami fails pending approval, lock the rest of the form with the pending message.

### 7.17 Staff `/staff/keys`

`GET /admin/api-keys?status=PENDING&limit=` (PENDING default; allow ACTIVE/REVOKED/EXPIRED filter).

Rows include `tenant_name`. Approve: `rate_limit_tier` sandbox | standard | high | unlimited, optional `expires_at`. Reject: reason required.

### 7.18 Staff tenants

`POST /admin/tenants/{tenant_id}/status` `{ status, reason }` where status is ACTIVE | INACTIVE | SUSPENDED.

Need tenant_id: from pending keys and from usage `tenant_id` on lines. Provide a UUID field for staff who have an id. Response includes `cache_ttl_seconds` — show “API keys may authenticate for up to N seconds after suspend because of cache.”

### 7.19 Staff usage

`GET /admin/usage?from=&to=` — invoicing view, one row per tenant per provider_scope. Do not sum PLATFORM + TENANT into one billable number.

---

## 8. Authentication (frontend)

Two mechanisms; **never mix on one request.**

| Surface | Header | Used by |
|---|---|---|
| Portal / staff | `Authorization: Bearer {access_token}` | All `/portal/*` except `whoami`; all `/admin/*`; signup/login have no auth |
| Verification API | `x-api-key: {plaintext_key}` | `/verifications*`, `/documents*`, `/templates` (submit catalog), `/portal/whoami` |

**Session object to persist** (from `SessionResponse`):

```
access_token, token_type, expires_in, tenant_id, user_id, email, role
```

Store `access_token` in `sessionStorage` (or httpOnly cookie **only if** you add a BFF later — the API does not set cookies today). Persist `expires_at = now + expires_in`. Proactive logout 60s before expiry or on 401.

Logout is client-side only (no revoke-session endpoint).

---

## 9. HTTP client rules

- `Content-Type: application/json` except `POST /documents` (`multipart/form-data`; do not set Content-Type manually — the boundary must be set by the browser).
- Timeout: 30s for JSON; upload can be longer (file up to 50MB).
- Idempotency: playground and any “submit job” UI must send `Idempotency-Key`.
- Pagination: `next_cursor` is opaque; pass back as `cursor` query param; do not parse it.
- 204 responses: no body (set default, disable, delete document).

---

## 10. Domain language (use in UI copy)

- **Tenant** — the company account.
- **Client** — the tenant’s customer (the entity a job belongs to).
- **Template** — named, versioned JSON config (document type). Jobs freeze `config_snapshot`.
- **Expected values** — what the tenant believes the document says.
- **job_status** — did the pipeline run?
- **verdict** — what did a completed run conclude?
- **STRICT** — never send documents to the platform model.

---

## 11. Enums (exact strings)

```
JobStatus: QUEUED | PROCESSING | COMPLETED | ERRORED | CANCELLED
Verdict: PASS | FAIL | PARTIAL | NOT_SPECIFIED
MatchStatus: MATCH | MISMATCH | NOT_SPECIFIED | NOT_VERIFIABLE
Severity: mandatory | advisory | disabled
StepStatus: (use API values as returned)
TemplateStatus: DRAFT | ACTIVE | INACTIVE
ApiKeyStatus: PENDING | ACTIVE | REVOKED | EXPIRED
ApiKeyEnvironment: SANDBOX | PRODUCTION
TenantStatus: ACTIVE | INACTIVE | SUSPENDED
UserRole: ADMIN | USER
ProviderStatus: ACTIVE | INACTIVE | UNHEALTHY
DataPolicy: STRICT | ALLOW_PLATFORM_FALLBACK
ProviderScope (usage): PLATFORM | TENANT | ALL (totals row only)
WebhookStatus: PENDING | IN_FLIGHT | RETRYING | SUCCESS | FAILED
Webhook events: verification.completed | verification.failed
Adapters: azure_openai | openai | openai_compatible
Rate limit tiers: sandbox | standard | high | unlimited
```

Rate limits (requests/minute per key): sandbox 60, standard 600, high 3000, unlimited disabled.

---

## 12. Request / response contracts (frontend types)

Base URL prefix: `/api/v1`.

### Auth

**POST `/portal/signup`** 201  
Body: `{ company_name, name, email, password }`  
**POST `/portal/login`** 200  
Body: `{ email, password }`  
Response both:

```ts
{
  access_token: string
  token_type: "bearer"
  expires_in: number
  tenant_id: string
  user_id: string
  email: string
  role: "ADMIN" | "USER"
}
```

**GET `/portal/whoami`** — header `x-api-key`  
`{ tenant_id, api_key_id, environment, rate_limit_tier }`

### Clients

**POST `/portal/clients`** 201 `{ name, contact_email? }`  
**GET `/portal/clients`** `ClientSummary[]`  
`{ client_id, tenant_id, name, contact_email, created_at }`

### API keys (JWT)

**POST `/portal/api-keys`** 201 `{ name, environment }` → summary + `plaintext_key` + `message`  
**GET `/portal/api-keys`** summary[]  
**POST `/portal/api-keys/{api_key_id}/revoke`** `{ reason }`

Admin:  
**GET `/admin/api-keys?status&limit`** → pending rows include `tenant_name`  
**POST `/admin/api-keys/{id}/approve`** `{ expires_at?, rate_limit_tier }`  
**POST `/admin/api-keys/{id}/reject`** `{ reason }`  
**POST `/admin/tenants/{tenant_id}/status`** `{ status, reason }` → `{ tenant_id, previous_status, status, cache_ttl_seconds }`

### Webhooks (JWT)

**POST `/portal/webhooks`** `{ client_id, url, description?, events? }` 201 includes `signing_secret`  
**GET `/portal/webhooks?client_id=`** required query  
**POST `/portal/webhooks/{endpoint_id}/rotate-secret`**  
**GET `/portal/webhooks/deliveries?reference_id&status&limit`**  
**POST `/portal/webhooks/deliveries/{log_id}/replay`** 202 empty

### AI (JWT)

**POST `/portal/ai-providers`** `{ name, adapter, model, api_key?, config }`  
**GET `/portal/ai-providers`** `{ data_policy, default_provider_id, providers }`  
**POST `/portal/ai-providers/{id}/health-check`**  
**POST `/portal/ai-providers/{id}/set-default`** 204  
**POST `/portal/ai-providers/{id}/disable`** 204  
**PUT `/portal/ai-providers/data-policy`** `{ data_policy }` 204

### Templates (JWT admin of config)

**GET `/portal/templates`** all versions  
**POST `/portal/templates/validate`** `{ config }` → `{ valid, problems }`  
**PUT `/portal/templates/{name}`** `{ config, activate }` 201  
**POST `/portal/templates/{name}/status`** `{ version, status }`

### Reference data (JWT)

**GET `/portal/reference-data`**  
**GET `/portal/reference-data/{key}?version`** includes `mapping`  
**PUT `/portal/reference-data/{key}`** `{ mapping, description? }` 201

### Usage (JWT)

**GET `/portal/usage?from&to&by_template`**  
**GET `/admin/usage?from&to`**  
Report: `{ period_start, period_end, lines, totals }`  
Line counters: `verifications, documents, pages, input_tokens, output_tokens, cached_input_tokens, failed_attempt_tokens`

### Documents (`x-api-key`)

**POST `/documents`** multipart: `file`, `client_id`, `doc_type?` → 201  
**GET `/documents/{document_id}`** metadata  
**DELETE `/documents/{document_id}`** 204 (fails if cited by a verification)

```ts
{
  document_id, client_id, file_name, content_type, size_bytes, sha256,
  uploaded_at, expires_at
}
```

Accepted: PDF, PNG, JPEG, WebP. Size cap 50MB.

### Verifications (`x-api-key`)

**POST `/verifications`** 202 or 200 (idempotent replay)

```ts
{
  reference_id: string
  client_id: string
  template: string
  documents: Array<
    | { type: "url"; url: string; file_name?: string; doc_type?: string }
    | { type: "document_id"; document_id: string; file_name?: string; doc_type?: string }
  > // 1–20
  expected_values?: Record<string, unknown> // max 100 keys
  callback_url?: string
  priority?: number // 1–1000, default 100, lower first
  metadata?: Record<string, unknown>
}
```

Header optional: `Idempotency-Key`.

**GET `/verifications/{id}`** full result  
**GET `/verifications/{id}/steps`** trace  
**GET `/verifications`** `updated_since, reference_id, job_status, cursor, limit (1–200)`  
**POST `/verifications/{id}/cancel`** QUEUED only  
**GET `/templates`** `{ name, version, expects: string[] }[]`

Verification result includes `checks[]`, `extracted_fields`, `expected_values`, `verdict`, `job_status`, timestamps, `failure_reason`, `extraction_strategy`, `attempt_count`, `metadata`.

### Health (no auth)

**GET `/health/live`**, **GET `/health/ready`** `{ status: "ok" }` — ready is 503 if DB down.

---

## 13. Example template JSON (preload in editor)

Use this as the “Challan example” insert (field list must stay consistent with checks):

```json
{
  "template_key": "challan",
  "description": "Indian government challan — PF / ESI / GST / LWF",
  "extraction": {
    "plugin": "extractor.generic",
    "strategy": "auto",
    "render": { "dpi": 150, "max_side": 1800, "format": "webp" },
    "max_text_chars": 20000,
    "timeout_s": 120,
    "instructions": "You are a document analyst extracting structured data from Indian government challans. Return ONLY valid JSON. If a field is not present, return null.",
    "fields": [
      { "key": "company_name", "label": "Company Name", "type": "string", "hint": "Full legal company name as printed." },
      { "key": "authority", "label": "Authority", "type": "string" },
      { "key": "state", "label": "State", "type": "string" },
      { "key": "challan_period", "label": "Challan Period", "type": "period" },
      { "key": "challan_amount", "label": "Challan Amount", "type": "number" },
      { "key": "challan_date", "label": "Challan Date", "type": "date", "format": "DD-MM-YYYY" }
    ]
  },
  "integrity": [
    { "plugin": "integrity.blank_page", "severity": "mandatory", "params": { "threshold": 0.985 } },
    { "plugin": "integrity.pdf_overlay", "severity": "mandatory", "params": {} },
    { "plugin": "integrity.metadata", "severity": "advisory", "params": { "deny_producers": ["iLovePDF", "Canva", "PDFium"] } }
  ],
  "checks": [
    { "plugin": "check.fuzzy_text", "field": "company_name", "expects": "company_name", "severity": "mandatory", "params": { "threshold": 95, "absence_rule": "both_absent" } },
    { "plugin": "check.authority_match", "field": "authority", "expects": "authority", "severity": "mandatory", "params": { "fuzzy_threshold": 90 } },
    { "plugin": "check.state_match", "field": "state", "expects": "state", "severity": "advisory", "params": { "threshold": 90 } },
    { "plugin": "check.numeric_equals", "field": "challan_amount", "expects": "challan_amount", "severity": "mandatory", "params": { "tolerance": 0 } },
    { "plugin": "check.period_match", "field": "challan_period", "expects": "challan_period", "severity": "mandatory", "params": { "absence_rule": "both_absent" } },
    { "plugin": "check.date_equals", "field": "challan_date", "expects": "challan_date", "severity": "mandatory", "params": { "tolerance_days": 0, "dayfirst": true } }
  ],
  "verdict_policy": {
    "any_mandatory_mismatch": "FAIL",
    "any_mandatory_integrity_fail": "FAIL",
    "all_mandatory_match": "PASS",
    "all_not_specified": "NOT_SPECIFIED",
    "otherwise": "PARTIAL"
  }
}
```

---

## 14. Suggested generated app structure

```
src/
  app/
    (marketing)/ page.tsx about/ docs/... signup login
    (console)/ app/... layout with sidebar
    (staff)/ staff/...
  components/ ui/ (Button, Input, Table, Modal, Pill, Callout)
  lib/
    api/ client.ts portal.ts admin.ts verification.ts types.ts
    auth/ session.ts
    format.ts
  content/docs/*.mdx   # docs pages
```

One `apiClient` with `auth: "jwt" | "apikey" | "none"`.

---

## 15. Acceptance checklist (the frontend is not done until)

- [ ] Landing, about, docs (all doc routes in §5), signup, login render and are copy-complete (no lorem).
- [ ] Signup/login persist JWT and reach `/app`.
- [ ] Clients CRUD-create + list; client_id copyable.
- [ ] API key create shows plaintext once; list never shows it; revoke requires reason.
- [ ] Webhook create shows signing secret once; list by client_id; rotate explained.
- [ ] Deliveries list + replay warning about `event_id`.
- [ ] Template validate lists all problems; save creates a new version; status change works.
- [ ] Reference data versioned save/get.
- [ ] AI provider register shows health; STRICT confirmation; default/disable.
- [ ] Usage tenant + admin views keep PLATFORM/TENANT split.
- [ ] Playground: whoami, upload, submit, poll, steps, list, cancel queued — all via `x-api-key`.
- [ ] Staff approve/reject keys and suspend tenant.
- [ ] Every error path shows `correlation_id`.
- [ ] No verification list attempted with JWT.
- [ ] No document byte preview.
- [ ] Responsive: marketing works on mobile; console tables scroll horizontally on small screens.
- [ ] Keyboard accessible modals (focus trap, ESC).

---

## 16. Prompt block to paste into Claude (optional)

Use this as the first message together with this file:

> Build the complete LensAI marketing site + tenant console + staff admin from `FRONTEND_GENERATION_SPEC.md`. Follow the stack in §4. Do not invent API routes. JWT for portal/admin, `x-api-key` only for playground verification/document calls. Implement secret-once modals. Port docs content from the spec and backend `docs/integration/`. Ship a working app against `NEXT_PUBLIC_API_BASE_URL`.

---

## 17. Backend files this spec was derived from

- `app/api/v1/router.py`, `endpoints/portal.py`, `admin.py`, `verifications.py`, `documents.py`, `health.py`
- `app/api/v1/schemas/*`
- `app/api/deps/auth.py` (rate limits, two auth types)
- `app/core/errors.py`, `core/security/webhook_signing.py`
- `app/infrastructure/db/seed.py` (challan template)
- `docs/integration/README.md`, `uploading-documents.md`

If those files change, update this spec before regenerating the frontend.
