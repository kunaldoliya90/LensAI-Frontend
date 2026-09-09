import { apiRequest } from "@/lib/api/client";
import type { NatureAvailable, PluginCatalogue } from "@/lib/api/types";

/** The read-only catalog every account sees — natures are platform-curated,
 * never something a tenant configures for itself. */
export function listNatures(): Promise<NatureAvailable[]> {
  return apiRequest<NatureAvailable[]>("/portal/natures", { auth: "jwt" });
}

/**
 * What this deployment can do. Identical for every tenant and changes only when
 * the backend is deployed, so the builder treats it as static for the session.
 */
export function getPluginCatalogue(): Promise<PluginCatalogue> {
  return apiRequest<PluginCatalogue>("/portal/plugins", { auth: "jwt" });
}
