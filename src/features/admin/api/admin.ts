import { apiRequest } from "@/lib/api/client";
import type {
  AdminSummary,
  ApiKeyStatus,
  ApiKeySummary,
  ClientWithTenant,
  NatureStatus,
  NatureValidation,
  NatureVersion,
  PendingApiKey,
  PlaygroundSessionIssued,
  RateLimitTier,
  TenantStatus,
  TenantStatusResult,
  TenantSummary,
} from "@/lib/api/types";

// --- API key approval queue and lifecycle — permission: api_keys ----------

export function listKeysByStatus(input: {
  status: ApiKeyStatus;
  limit: number;
}): Promise<PendingApiKey[]> {
  return apiRequest<PendingApiKey[]>("/admin/api-keys", {
    auth: "jwt",
    query: { status: input.status, limit: input.limit },
  });
}

export function approveApiKey(input: {
  apiKeyId: string;
  rateLimitTier: RateLimitTier;
  expiresAt?: string;
}): Promise<ApiKeySummary> {
  return apiRequest<ApiKeySummary>(`/admin/api-keys/${input.apiKeyId}/approve`, {
    method: "POST",
    auth: "jwt",
    json: { rate_limit_tier: input.rateLimitTier, expires_at: input.expiresAt ?? null },
  });
}

export function rejectApiKey(input: { apiKeyId: string; reason: string }): Promise<ApiKeySummary> {
  return apiRequest<ApiKeySummary>(`/admin/api-keys/${input.apiKeyId}/reject`, {
    method: "POST",
    auth: "jwt",
    json: { reason: input.reason },
  });
}

/** The counterpart to reject, for a key that is already ACTIVE. Same action,
 * same audit trail — reject is for the approval queue, this is for the rest. */
export function revokeAnyApiKey(input: {
  apiKeyId: string;
  reason: string;
}): Promise<ApiKeySummary> {
  return apiRequest<ApiKeySummary>(`/admin/api-keys/${input.apiKeyId}/revoke`, {
    method: "POST",
    auth: "jwt",
    json: { reason: input.reason },
  });
}

// --- Tenants and cross-tenant clients — permission: tenants ---------------

export function listTenants(input?: {
  status?: TenantStatus;
  limit?: number;
}): Promise<TenantSummary[]> {
  return apiRequest<TenantSummary[]>("/admin/tenants", {
    auth: "jwt",
    query: { status: input?.status, limit: input?.limit ?? 200 },
  });
}

export function setTenantStatus(input: {
  tenantId: string;
  status: TenantStatus;
  reason: string;
}): Promise<TenantStatusResult> {
  return apiRequest<TenantStatusResult>(`/admin/tenants/${input.tenantId}/status`, {
    method: "POST",
    auth: "jwt",
    json: { status: input.status, reason: input.reason },
  });
}

export function listAllClients(input?: {
  tenantId?: string;
  limit?: number;
}): Promise<ClientWithTenant[]> {
  return apiRequest<ClientWithTenant[]>("/admin/clients", {
    auth: "jwt",
    query: { tenant_id: input?.tenantId, limit: input?.limit ?? 500 },
  });
}

// --- The nature catalog — SUPER_ADMIN only ---------------------------------

export function listNatures(): Promise<NatureVersion[]> {
  return apiRequest<NatureVersion[]>("/admin/natures", { auth: "jwt" });
}

export function validateNature(config: Record<string, unknown>): Promise<NatureValidation> {
  return apiRequest<NatureValidation>("/admin/natures/validate", {
    method: "POST",
    auth: "jwt",
    json: { config, activate: true },
  });
}

export function createNature(input: {
  key: string;
  label: string;
  config: Record<string, unknown>;
  activate: boolean;
}): Promise<NatureVersion> {
  return apiRequest<NatureVersion>("/admin/natures", {
    method: "POST",
    auth: "jwt",
    json: input,
  });
}

export function saveNature(input: {
  key: string;
  config: Record<string, unknown>;
  activate: boolean;
}): Promise<NatureVersion> {
  return apiRequest<NatureVersion>(`/admin/natures/${encodeURIComponent(input.key)}`, {
    method: "PUT",
    auth: "jwt",
    json: { config: input.config, activate: input.activate },
  });
}

export function setNatureStatus(input: {
  key: string;
  version: number;
  status: NatureStatus;
}): Promise<NatureVersion> {
  return apiRequest<NatureVersion>(
    `/admin/natures/${encodeURIComponent(input.key)}/status`,
    { method: "POST", auth: "jwt", json: { version: input.version, status: input.status } },
  );
}

// --- Other admins — SUPER_ADMIN only ---------------------------------------

export function listAdmins(): Promise<AdminSummary[]> {
  return apiRequest<AdminSummary[]>("/admin/admins", { auth: "jwt" });
}

export function createAdmin(input: {
  name: string;
  email: string;
  password: string;
  permissions: string[];
}): Promise<AdminSummary> {
  return apiRequest<AdminSummary>("/admin/admins", {
    method: "POST",
    auth: "jwt",
    json: input,
  });
}

export function updateAdminPermissions(input: {
  userId: string;
  permissions: string[];
}): Promise<AdminSummary> {
  return apiRequest<AdminSummary>(`/admin/admins/${input.userId}/permissions`, {
    method: "POST",
    auth: "jwt",
    json: { permissions: input.permissions },
  });
}

export function setAdminStatus(input: {
  userId: string;
  status: "ACTIVE" | "INACTIVE";
}): Promise<AdminSummary> {
  return apiRequest<AdminSummary>(`/admin/admins/${input.userId}/status`, {
    method: "POST",
    auth: "jwt",
    json: { status: input.status },
  });
}

// --- Admin playground — any staff account ----------------------------------

/** Mints and immediately approves a sandbox key scoped to the LensAI internal
 * playground client. No manual create-then-wait-for-approval dance — the
 * caller already holds every permission that flow exists to gate. */
export function issuePlaygroundSession(): Promise<PlaygroundSessionIssued> {
  return apiRequest<PlaygroundSessionIssued>("/admin/playground/session", {
    method: "POST",
    auth: "jwt",
  });
}
