"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { formatInteger } from "@/lib/format";
import { listReferenceData } from "../api/referenceData";

const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,99}$/;

export function ReferenceData() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [key, setKey] = useState("");
  const tables = useQuery({ queryKey: ["reference-data"], queryFn: listReferenceData });

  const invalid = key !== "" && !KEY_PATTERN.test(key);

  return (
    <>
      <PageHeader
        title="Reference data"
        description="Your own authority and state naming. A template check opts in by name; checks that do not name a table keep the built-in defaults."
        actions={<Button onClick={() => setCreating(true)}>New table</Button>}
      />

      {tables.isError ? <ErrorNotice error={tables.error} /> : null}

      <TableScroll>
        <Table className="min-w-[44rem]">
          <thead>
            <Tr>
              <Th>Key</Th>
              <Th>Latest version</Th>
              <Th>Entries</Th>
              <Th>Description</Th>
              <Th>Created</Th>
            </Tr>
          </thead>
          <tbody>
            {tables.isPending ? <TableMessage columns={5}>Loading tables…</TableMessage> : null}

            {!tables.isPending && (tables.data?.length ?? 0) === 0 ? (
              <TableMessage columns={5}>
                No tables uploaded. LensAI&rsquo;s built-in authority and state maps are in use.
              </TableMessage>
            ) : null}

            {tables.data?.map((table) => (
              <Tr key={table.reference_data_id}>
                <Td className="font-medium">
                  <Link
                    href={`/app/reference-data/${encodeURIComponent(table.key)}`}
                    className="font-mono text-[13px] text-accent-bright underline underline-offset-2"
                  >
                    {table.key}
                  </Link>
                </Td>
                <Td className="font-mono text-[13px]">v{table.version}</Td>
                <Td className="text-ink-muted">{formatInteger(table.entry_count)}</Td>
                <Td className="text-ink-muted">{table.description ?? "—"}</Td>
                <Td className="text-ink-muted">
                  <Timestamp value={table.created_at} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>

      <Callout tone="neutral" title="Opting a check in">
        Add <code className="font-mono text-[13px]">&quot;reference_data&quot;: &quot;authority_map&quot;</code>{" "}
        to a check&rsquo;s params in the template, naming the key you uploaded. Saving here always
        writes a new version, and a job freezes the map it used — so a verdict explained a year from
        now uses the naming that produced it, not whatever you have corrected since.
      </Callout>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New reference table"
        description="The key is how a template check names this table."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              disabled={key === "" || invalid}
              onClick={() => router.push(`/app/reference-data/${key}`)}
            >
              Open editor
            </Button>
          </>
        }
      >
        <Input
          label="Key"
          required
          autoFocus
          mono
          placeholder="authority_map"
          hint="Lowercase letters, digits, hyphen and underscore."
          error={invalid ? "Use lowercase letters, digits, hyphen or underscore." : undefined}
          value={key}
          onChange={(event) => setKey(event.target.value.trim())}
        />
      </Modal>
    </>
  );
}
