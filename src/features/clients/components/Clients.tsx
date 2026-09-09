"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import { listClients } from "../api/clients";
import { ClientsTable } from "./ClientsTable";
import { CreateClientDialog } from "./CreateClientDialog";

export function Clients() {
  const [creating, setCreating] = useState(false);
  const clients = useQuery({ queryKey: ["clients"], queryFn: listClients });

  return (
    <>
      <PageHeader
        title="Clients"
        description="Your own customers, subsidiaries or business units. Jobs, uploads and webhook endpoints all hang off a client_id."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-4" />
            Create client
          </Button>
        }
      />

      {clients.isError ? <ErrorNotice error={clients.error} /> : null}

      <ClientsTable
        clients={clients.data ?? []}
        loading={clients.isPending}
        onCreate={() => setCreating(true)}
      />

      <Callout tone="neutral">
        There is no update or delete for clients — the API has neither, because a client is
        referenced by every verification ever run for it.
      </Callout>

      <CreateClientDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
