export type Credential = "x-api-key" | "Bearer" | "Bearer + ADMIN" | "none";

export interface ApiRoute {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  credential: Credential;
  returns: string;
  summary: string;
}

export interface ApiRouteGroup {
  heading: string;
  note?: string;
  routes: ApiRoute[];
}

export const API_ROUTES: ApiRouteGroup[] = [
  {
    heading: "Session",
    routes: [
      {
        method: "POST",
        path: "/portal/signup",
        credential: "none",
        returns: "201 SessionResponse",
        summary: "Create a tenant and its first user.",
      },
      {
        method: "POST",
        path: "/portal/login",
        credential: "none",
        returns: "200 SessionResponse",
        summary: "Exchange email and password for a session token.",
      },
      {
        method: "GET",
        path: "/portal/whoami",
        credential: "x-api-key",
        returns: "WhoAmIResponse",
        summary: "Which tenant, environment and tier a key resolves to.",
      },
    ],
  },
  {
    heading: "Verification API",
    note: "The surface your backend integrates against.",
    routes: [
      {
        method: "POST",
        path: "/verifications",
        credential: "x-api-key",
        returns: "202 (200 on replay) VerificationAccepted",
        summary: "Submit a document and the values you expect.",
      },
      {
        method: "GET",
        path: "/verifications/{verification_id}",
        credential: "x-api-key",
        returns: "VerificationResult",
        summary: "The full result, including every per-field check.",
      },
      {
        method: "GET",
        path: "/verifications/{verification_id}/steps",
        credential: "x-api-key",
        returns: "VerificationTrace",
        summary: "Every plugin that ran, with per-stage latency.",
      },
      {
        method: "GET",
        path: "/verifications",
        credential: "x-api-key",
        returns: "VerificationPage",
        summary: "Keyset-paginated list. updated_since is the reconciliation sweep.",
      },
      {
        method: "POST",
        path: "/verifications/{verification_id}/cancel",
        credential: "x-api-key",
        returns: "VerificationSummary",
        summary: "Cancel a job that is still QUEUED.",
      },
      {
        method: "GET",
        path: "/natures",
        credential: "x-api-key",
        returns: "NatureAvailable[]",
        summary: "Submittable document types and the expected_values keys each consumes.",
      },
    ],
  },
  {
    heading: "Documents",
    routes: [
      {
        method: "POST",
        path: "/documents",
        credential: "x-api-key",
        returns: "201 DocumentUploaded",
        summary: "Multipart upload: file, client_id, optional doc_type.",
      },
      {
        method: "GET",
        path: "/documents/{document_id}",
        credential: "x-api-key",
        returns: "DocumentUploaded",
        summary: "Metadata only — never the bytes.",
      },
      {
        method: "DELETE",
        path: "/documents/{document_id}",
        credential: "x-api-key",
        returns: "204",
        summary: "Refused once a verification cites the document.",
      },
    ],
  },
  {
    heading: "Clients and keys",
    routes: [
      {
        method: "POST",
        path: "/portal/clients",
        credential: "Bearer",
        returns: "201 ClientSummary",
        summary: "Create a client.",
      },
      {
        method: "GET",
        path: "/portal/clients",
        credential: "Bearer",
        returns: "ClientSummary[]",
        summary: "List clients.",
      },
      {
        method: "POST",
        path: "/portal/api-keys",
        credential: "Bearer",
        returns: "201 ApiKeyIssued",
        summary: "Request a key. Issued PENDING; plaintext returned once.",
      },
      {
        method: "GET",
        path: "/portal/api-keys",
        credential: "Bearer",
        returns: "ApiKeySummary[]",
        summary: "List keys. Never carries secret material.",
      },
      {
        method: "POST",
        path: "/portal/api-keys/{api_key_id}/revoke",
        credential: "Bearer",
        returns: "ApiKeySummary",
        summary: "Revoke immediately. A reason is required.",
      },
    ],
  },
  {
    heading: "Webhooks",
    routes: [
      {
        method: "POST",
        path: "/portal/webhooks",
        credential: "Bearer",
        returns: "201 WebhookEndpointCreated",
        summary: "Register an endpoint. Signing secret returned once.",
      },
      {
        method: "GET",
        path: "/portal/webhooks?client_id=",
        credential: "Bearer",
        returns: "WebhookEndpointSummary[]",
        summary: "Endpoints for one client. client_id is required.",
      },
      {
        method: "POST",
        path: "/portal/webhooks/{endpoint_id}/rotate-secret",
        credential: "Bearer",
        returns: "WebhookSecretRotated",
        summary: "New secret; the old one stays valid for 24 hours.",
      },
      {
        method: "GET",
        path: "/portal/webhooks/deliveries",
        credential: "Bearer",
        returns: "DeliverySummary[]",
        summary: "Delivery history. Filter by reference_id or status; no payloads.",
      },
      {
        method: "POST",
        path: "/portal/webhooks/deliveries/{log_id}/replay",
        credential: "Bearer",
        returns: "202",
        summary: "Re-send a settled delivery. The event_id does not change.",
      },
    ],
  },
  {
    heading: "Document types and reference data",
    routes: [
      {
        method: "GET",
        path: "/portal/natures",
        credential: "Bearer",
        returns: "NatureAvailable[]",
        summary: "The same shared catalog as GET /natures, for the console.",
      },
      {
        method: "GET",
        path: "/portal/reference-data",
        credential: "Bearer",
        returns: "ReferenceDataSummary[]",
        summary: "Latest version of each lookup table.",
      },
      {
        method: "GET",
        path: "/portal/reference-data/{key}",
        credential: "Bearer",
        returns: "ReferenceDataDetail",
        summary: "One table, at a version or at the latest.",
      },
      {
        method: "PUT",
        path: "/portal/reference-data/{key}",
        credential: "Bearer",
        returns: "201 ReferenceDataSummary",
        summary: "Replace the table wholesale as a new version.",
      },
    ],
  },
  {
    heading: "AI providers",
    routes: [
      {
        method: "POST",
        path: "/portal/ai-providers",
        credential: "Bearer",
        returns: "201 ProviderRegistered",
        summary: "Register an endpoint; health is probed inline.",
      },
      {
        method: "GET",
        path: "/portal/ai-providers",
        credential: "Bearer",
        returns: "RoutingSummary",
        summary: "Your providers, the default, and the data policy.",
      },
      {
        method: "POST",
        path: "/portal/ai-providers/{provider_id}/health-check",
        credential: "Bearer",
        returns: "ProviderRegistered",
        summary: "Re-probe; clears UNHEALTHY on recovery.",
      },
      {
        method: "POST",
        path: "/portal/ai-providers/{provider_id}/set-default",
        credential: "Bearer",
        returns: "204",
        summary: "Route the whole account through one provider.",
      },
      {
        method: "POST",
        path: "/portal/ai-providers/{provider_id}/disable",
        credential: "Bearer",
        returns: "204",
        summary: "Take it out of the routing chain. Not a delete.",
      },
      {
        method: "PUT",
        path: "/portal/ai-providers/data-policy",
        credential: "Bearer",
        returns: "204",
        summary: "STRICT or ALLOW_PLATFORM_FALLBACK.",
      },
    ],
  },
  {
    heading: "Usage",
    routes: [
      {
        method: "GET",
        path: "/portal/usage?from=&to=&by_template=",
        credential: "Bearer",
        returns: "UsageReport",
        summary: "Your usage, split by provider scope. Defaults to this month.",
      },
      {
        method: "GET",
        path: "/admin/usage?from=&to=",
        credential: "Bearer + ADMIN",
        returns: "UsageReport",
        summary: "One row per tenant per provider scope. The invoicing query.",
      },
    ],
  },
  {
    heading: "Platform administration",
    note: "LensAI staff only. An API key can never reach these.",
    routes: [
      {
        method: "GET",
        path: "/admin/api-keys?status=&limit=",
        credential: "Bearer + ADMIN",
        returns: "PendingApiKey[]",
        summary: "The approval queue, oldest first.",
      },
      {
        method: "POST",
        path: "/admin/api-keys/{api_key_id}/approve",
        credential: "Bearer + ADMIN",
        returns: "ApiKeySummary",
        summary: "Activate a pending key and set its rate-limit tier.",
      },
      {
        method: "POST",
        path: "/admin/api-keys/{api_key_id}/reject",
        credential: "Bearer + ADMIN",
        returns: "ApiKeySummary",
        summary: "Reject a pending key. A reason is required.",
      },
      {
        method: "POST",
        path: "/admin/tenants/{tenant_id}/status",
        credential: "Bearer + ADMIN",
        returns: "status + cache_ttl_seconds",
        summary: "Suspend or reactivate a tenant.",
      },
    ],
  },
];

/** Outside the /api/v1 prefix — these hang off the API origin. */
export const HEALTH_ROUTES: ApiRoute[] = [
  {
    method: "GET",
    path: "/health/live",
    credential: "none",
    returns: '{"status":"ok"}',
    summary: "Liveness. Answers as long as the process is up.",
  },
  {
    method: "GET",
    path: "/health/ready",
    credential: "none",
    returns: '{"status":"ok"} or 503',
    summary: "Readiness. 503 when a dependency such as the database is down.",
  },
];
