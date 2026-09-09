"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Select } from "@/components/ui/Select";
import { listClients } from "../api/clients";

/**
 * client_id is required on uploads, webhook endpoints and verifications, so
 * this picker is shared rather than rebuilt on each of those pages.
 */
export function ClientSelect({
  value,
  onChange,
  label = "Client",
  hint,
  required,
}: {
  value: string;
  onChange: (clientId: string) => void;
  label?: string;
  hint?: ReactNode;
  required?: boolean;
}) {
  const clients = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const placeholder = clients.isPending
    ? "Loading clients…"
    : clients.data?.length
      ? "Select a client"
      : "No clients yet — create one first";

  return (
    <div className="grid gap-2">
      <Select
        label={label}
        hint={hint}
        required={required}
        value={value}
        disabled={clients.isPending || clients.data?.length === 0}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {clients.data?.map((client) => (
          <option key={client.client_id} value={client.client_id}>
            {client.name}
          </option>
        ))}
      </Select>

      {clients.isError ? <ErrorNotice error={clients.error} title="Could not load clients" /> : null}
    </div>
  );
}
