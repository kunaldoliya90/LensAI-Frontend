"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { listClients } from "@/features/clients/api/clients";
import { listAllClients, listTenants } from "@/features/admin/api/admin";
import { useUrlParams } from "@/hooks/useUrlParams";
import { isStaff } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { DIMENSION_LABEL } from "../api/insights";
import { PERIODS, readScope } from "../scope";

const SELECT_CLASS =
  "h-[34px] max-w-[230px] min-w-0 cursor-pointer appearance-none rounded-md border border-line-strong bg-ground bg-[length:10px_6px] bg-[right_11px_center] bg-no-repeat pr-8 pl-2.5 text-[13.5px] text-ink shadow-xs hover:border-ink-subtle disabled:cursor-not-allowed disabled:bg-deep-2 disabled:text-ink-subtle";

// The chevron, as a data URI so the native <select> keeps its own semantics.
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' stroke='%23667085' stroke-width='1.6'%3E%3Cpath d='M1 1l4 4 4-4'/%3E%3C/svg%3E\")";

/**
 * The sticky scope bar every Insights page shares: tenant (staff only),
 * client and period. Each change writes the URL, which is the only copy of
 * the scope, and resets paging.
 */
export function InsightsScopeBar() {
  const session = useSession();
  const staff = isStaff(session);
  const { params, setParams } = useUrlParams();
  const scope = readScope(params, staff);

  const tenants = useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: () => listTenants(),
    enabled: staff,
  });
  const clients = useQuery({
    queryKey: staff ? ["admin", "clients", scope.tenantId ?? "all"] : ["clients"],
    queryFn: async () =>
      staff
        ? (await listAllClients({ tenantId: scope.tenantId })).map((c) => ({
            client_id: c.client_id,
            name: c.name,
          }))
        : listClients(),
  });

  return (
    <div className="sticky top-14 z-[5] -mx-4 -mt-4 flex flex-wrap items-end gap-x-3 gap-y-2.5 border-b border-line bg-ground px-4 py-2.5 sm:-mx-5 sm:-mt-5 sm:px-5">
      {staff ? (
        <ScopeField label="Tenant">
          <select
            className={SELECT_CLASS}
            style={{ backgroundImage: CHEVRON }}
            value={scope.tenantId ?? ""}
            onChange={(e) => setParams({ tenant: e.target.value || null, client: null, page: null })}
          >
            <option value="">All tenants</option>
            {tenants.data?.map((t) => (
              <option key={t.tenant_id} value={t.tenant_id}>
                {t.name}
              </option>
            ))}
          </select>
        </ScopeField>
      ) : null}

      <ScopeField label="Client">
        <select
          className={SELECT_CLASS}
          style={{ backgroundImage: CHEVRON }}
          value={scope.clientId ?? ""}
          onChange={(e) => setParams({ client: e.target.value || null, page: null })}
        >
          <option value="">All clients</option>
          {clients.data?.map((c) => (
            <option key={c.client_id} value={c.client_id}>
              {c.name}
            </option>
          ))}
        </select>
      </ScopeField>

      <ScopeField label="Period">
        <select
          className={SELECT_CLASS}
          style={{ backgroundImage: CHEVRON }}
          value={scope.months}
          onChange={(e) => setParams({ months: e.target.value === "12" ? null : e.target.value, page: null })}
        >
          {PERIODS.map((months) => (
            <option key={months} value={months}>
              Last {months} months
            </option>
          ))}
        </select>
      </ScopeField>
    </div>
  );
}

function ScopeField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-[3px]">
      <span className="text-[11px] font-medium text-ink-subtle">{label}</span>
      {children}
    </label>
  );
}

/** The active click-to-filter dimensions, each removable, plus "Clear all". */
export function FilterChips() {
  const { params, setParams } = useUrlParams();
  const scope = readScope(params, false);
  const entries = Object.entries(scope.filters) as [keyof typeof DIMENSION_LABEL, string][];
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line-strong bg-ground pr-1 pl-2.5 text-[12.5px] text-ink-muted"
        >
          {DIMENSION_LABEL[key]}: <b className="font-semibold text-ink">{value}</b>
          <button
            type="button"
            aria-label={`Remove ${DIMENSION_LABEL[key]} filter`}
            onClick={() => setParams({ [key]: null, page: null })}
            className="grid size-5 place-items-center rounded-sm text-ink-subtle hover:bg-surface-strong hover:text-ink"
          >
            <X aria-hidden className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => setParams({ ...Object.fromEntries(entries.map(([k]) => [k, null])), page: null })}
        className="px-0.5 py-1 text-[12.5px] font-medium text-accent hover:underline hover:underline-offset-[3px]"
      >
        Clear all
      </button>
    </div>
  );
}
