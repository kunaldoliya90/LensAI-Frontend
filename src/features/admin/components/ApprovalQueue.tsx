"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { numberIn, oneOf, useUrlParams } from "@/hooks/useUrlParams";
import type { ApiKeyStatus, PendingApiKey } from "@/lib/api/types";
import { listKeysByStatus } from "../api/admin";
import { ApproveKeyDialog } from "./ApproveKeyDialog";
import { RejectKeyDialog } from "./RejectKeyDialog";

const STATUSES: ApiKeyStatus[] = ["PENDING", "ACTIVE", "REVOKED", "EXPIRED"];
const LIMITS = [25, 50, 100, 250, 500];

export function ApprovalQueue() {
  const { params, setParams } = useUrlParams();
  const status = oneOf(params.get("status"), STATUSES, "PENDING");
  const limit = numberIn(params.get("limit"), LIMITS, 100);

  const [approving, setApproving] = useState<PendingApiKey | null>(null);
  const [rejecting, setRejecting] = useState<PendingApiKey | null>(null);

  const keys = useQuery({
    queryKey: ["admin-api-keys", status, limit],
    queryFn: () => listKeysByStatus({ status, limit }),
  });

  return (
    <>
      <PageHeader
        title="Approval queue"
        description="Keys are issued PENDING and authenticate nothing until approved here. Oldest first — a key waiting three days outranks today's."
      />

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
              <Th>Requested</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </thead>
          <tbody>
            {keys.isPending ? <TableMessage columns={8}>Loading the queue…</TableMessage> : null}

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
                  <Timestamp value={key.created_at} />
                </Td>
                <Td>
                  {key.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setApproving(key)}>
                        Approve
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejecting(key)}>
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>

      <ApproveKeyDialog apiKey={approving} onClose={() => setApproving(null)} />
      <RejectKeyDialog apiKey={rejecting} onClose={() => setRejecting(null)} />
    </>
  );
}
