import { apiRequest, apiRequestDetailed } from "@/lib/api/client";
import type {
  DocumentUploaded,
  JobStatus,
  NatureAvailable,
  VerificationAccepted,
  VerificationPage,
  VerificationResult,
  VerificationSubmit,
  VerificationSummary,
  VerificationTrace,
  WhoAmIResponse,
} from "@/lib/api/types";

/**
 * The only calls in the console that use `x-api-key`. There is no JWT route to
 * read verifications, so this whole surface is keyed on a key the user pastes.
 */

const UPLOAD_TIMEOUT_MS = 180_000;

export function whoami(apiKey: string): Promise<WhoAmIResponse> {
  return apiRequest<WhoAmIResponse>("/portal/whoami", { auth: "apikey", apiKey });
}

export function listSubmittableNatures(apiKey: string): Promise<NatureAvailable[]> {
  return apiRequest<NatureAvailable[]>("/natures", { auth: "apikey", apiKey });
}

export function uploadDocument(input: {
  apiKey: string;
  clientId: string;
  file: File;
  docType?: string;
}): Promise<DocumentUploaded> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("client_id", input.clientId);
  if (input.docType) form.append("doc_type", input.docType);

  return apiRequest<DocumentUploaded>("/documents", {
    method: "POST",
    auth: "apikey",
    apiKey: input.apiKey,
    form,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
}

export async function submitVerification(input: {
  apiKey: string;
  idempotencyKey: string;
  body: VerificationSubmit;
}): Promise<{ accepted: VerificationAccepted; wasReplay: boolean }> {
  const { data, status } = await apiRequestDetailed<VerificationAccepted>("/verifications", {
    method: "POST",
    auth: "apikey",
    apiKey: input.apiKey,
    headers: { "Idempotency-Key": input.idempotencyKey },
    json: input.body,
  });

  // 202 is a new job; 200 means the key replayed an earlier identical request.
  return { accepted: data, wasReplay: status === 200 };
}

export function getVerification(apiKey: string, id: string): Promise<VerificationResult> {
  return apiRequest<VerificationResult>(`/verifications/${id}`, { auth: "apikey", apiKey });
}

export function getVerificationTrace(apiKey: string, id: string): Promise<VerificationTrace> {
  return apiRequest<VerificationTrace>(`/verifications/${id}/steps`, { auth: "apikey", apiKey });
}

export function listVerifications(input: {
  apiKey: string;
  cursor?: string;
  limit: number;
  jobStatus?: JobStatus;
  referenceId?: string;
  updatedSince?: string;
}): Promise<VerificationPage> {
  return apiRequest<VerificationPage>("/verifications", {
    auth: "apikey",
    apiKey: input.apiKey,
    query: {
      cursor: input.cursor,
      limit: input.limit,
      job_status: input.jobStatus,
      reference_id: input.referenceId,
      updated_since: input.updatedSince,
    },
  });
}

export function cancelVerification(apiKey: string, id: string): Promise<VerificationSummary> {
  return apiRequest<VerificationSummary>(`/verifications/${id}/cancel`, {
    method: "POST",
    auth: "apikey",
    apiKey,
  });
}
