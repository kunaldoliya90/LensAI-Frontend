"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { numberIn, oneOf, useUrlParams } from "@/hooks/useUrlParams";
import type { ApiKeyStatus, PendingApiKey } from "@/lib/api/types";
import { listKeysByStatus } from "../api/admin";
import { RevokeKeyDialog } from "./RevokeKeyDialog";

const STATUSES: ApiKeyStatus[] = ["ACTIVE", "PENDING", "REVOKED", "EXPIRED"];
const LIMITS = [25, 50, 100, 250, 500];

export function AllApiKeysManager() {
  const { params, setParams } = useUrlParams();
  const status = oneOf(params.get("status"), STATUSES, "ACTIVE");
  const limit = numberIn(params.get("limit"), LIMITS, 100);

  const [revoking, setRevoking] = useState<PendingApiKey | null>(null);

  const keys = useQuery({
    queryKey: ["admin-api-keys", status, limit],
    queryFn: () => listKeysByStatus({ status, limit }),
  });

  return (
    <>
      <PageHeader
        title="API keys"
        description="Every key, any tenant, any status. Pending keys wait in the approval queue — this is for the rest."
      />

      {status === "PENDING" ? (
        <Callout tone="neutral">
          Approving and rejecting a pending key happen on{" "}
          <Link href="/staff/keys" className="text-accent-bright underline underline-offset-2">
            the approval queue
          </Link>
          . This view is read-only for that status.
        </Callout>
      ) : null}

      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <Select
          label="Status"
          value={status}
          onChange={(event) => setParams({ status: event.target.value })}
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select
          label="Rows"
          value={String(limit)}
          onChange={(event) => setParams({ limit: event.target.value })}
        >
          {LIMITS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      {keys.isError ? <ErrorNotice error={keys.error} /> : null}

      <TableScroll>
        <Table className="min-w-[68rem]">
          <thead>
            <Tr>
              <Th>Tenant</Th>
              <Th>Key name</Th>
              <Th>Prefix</Th>
              <Th>Environment</Th>
              <Th>Status</Th>
              <Th>Tier</Th>
              <Th>Last used</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </thead>
          <tbody>
            {keys.isPending ? <TableMessage columns={8}>Loading…</TableMessage> : null}

            {!keys.isPending && (keys.data?.length ?? 0) === 0 ? (
              <TableMessage columns={8}>Nothing with status {status}.</TableMessage>
            ) : null}

            {keys.data?.map((key) => (
              <Tr key={key.api_key_id}>
                <Td className="font-medium">{key.tenant_name}</Td>
                <Td>{key.name}</Td>
                <Td>
                  <code className="font-mono text-[12px]">{key.key_prefix}…</code>
                </Td>
                <Td>
                  <StatusPill value={key.environment} />
                </Td>
                <Td>
                  <StatusPill value={key.status} />
                </Td>
                <Td className="text-ink-muted">{key.rate_limit_tier}</Td>
                <Td className="text-ink-muted">
                  {key.last_used_at ? <Timestamp value={key.last_used_at} /> : "Never"}
                </Td>
                <Td>
                  {key.status === "ACTIVE" ? (
                    <Button variant="danger" size="sm" onClick={() => setRevoking(key)}>
                      Revoke
                    </Button>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>

      <RevokeKeyDialog apiKey={revoking} onClose={() => setRevoking(null)} />
    </>
  );
}
