"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { numberIn, oneOf, useUrlParams } from "@/hooks/useUrlParams";
import { usePlaygroundApiKey } from "@/lib/auth/useSession";
import type { WebhookStatus } from "@/lib/api/types";
import { listDeliveries, replayDelivery } from "../api/deliveries";
import { DeliveriesTable } from "./DeliveriesTable";

const STATUSES: WebhookStatus[] = ["PENDING", "IN_FLIGHT", "RETRYING", "SUCCESS", "FAILED"];
const LIMITS = [25, 50, 100, 200];

export function Deliveries() {
  const { params, setParams } = useUrlParams();
  const queryClient = useQueryClient();
  const playgroundKey = usePlaygroundApiKey();

  const referenceId = params.get("reference_id") ?? "";
  const status = params.get("status") ? oneOf(params.get("status"), STATUSES, "FAILED") : "";
  const limit = numberIn(params.get("limit"), LIMITS, 50);

  const deliveries = useQuery({
    queryKey: ["deliveries", referenceId, status, limit],
    queryFn: () =>
      listDeliveries({
        reference_id: referenceId || undefined,
        status: status || undefined,
        limit,
      }),
  });

  const replay = useMutation({
    mutationFn: replayDelivery,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deliveries"] }),
  });

  return (
    <>
      <PageHeader
        title="Webhook deliveries"
        description="What LensAI tried to send you, and how each attempt went. The first place to look when an event did not arrive."
        actions={
          <Button variant="secondary" onClick={() => deliveries.refetch()}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="reference_id"
          mono
          placeholder="EVD233_19_883"
          hint="Your own identifier for the record."
          defaultValue={referenceId}
          onBlur={(event) => setParams({ reference_id: event.target.value.trim() || null })}
        />

        <Select
          label="Status"
          value={status}
          onChange={(event) => setParams({ status: event.target.value || null })}
        >
          <option value="">All statuses</option>
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

      <Callout tone="warn" title="A replay keeps the original event_id">
        Re-sending is for after you have fixed an endpoint that dead-lettered a batch. Your consumer
        must recognise the duplicate and drop it — that is what at-least-once delivery means, and a
        fresh id would defeat your deduplication at the one moment it matters.
      </Callout>

      {deliveries.isError ? <ErrorNotice error={deliveries.error} /> : null}
      {replay.isError ? <ErrorNotice error={replay.error} title="Could not queue the replay" /> : null}
      {replay.isSuccess ? (
        <Callout tone="pass" title="Replay queued">
          The delivery was accepted for re-sending. Refresh in a moment to see the new attempt.
        </Callout>
      ) : null}

      <DeliveriesTable
        deliveries={deliveries.data ?? []}
        loading={deliveries.isPending}
        replayingId={replay.isPending ? replay.variables : null}
        canOpenInPlayground={playgroundKey !== null}
        onReplay={(logId) => replay.mutate(logId)}
      />

      <p className="text-sm text-ink-muted">
        Payloads are deliberately absent from this list: returning every body would make it a bulk
        export of extracted document values. Fetch the verification itself for content.
      </p>
    </>
  );
}
