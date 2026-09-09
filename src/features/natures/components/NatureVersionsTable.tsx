import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import type { NatureStatus, NatureVersion } from "@/lib/api/types";

export function NatureVersionsTable({
  versions,
  loading,
  showName = true,
  pendingVersion,
  onStatusChange,
}: {
  versions: NatureVersion[];
  loading: boolean;
  showName?: boolean;
  pendingVersion?: number | null;
  onStatusChange?: (version: number, status: NatureStatus) => void;
}) {
  const columns = showName ? 5 : 4;

  return (
    <TableScroll>
      <Table className="min-w-[44rem]">
        <thead>
          <Tr>
            {showName ? <Th>Name</Th> : null}
            <Th>Version</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </Tr>
        </thead>
        <tbody>
          {loading ? <TableMessage columns={columns}>Loading versions…</TableMessage> : null}

          {!loading && versions.length === 0 ? (
            <TableMessage columns={columns}>
              No versions yet. A verification can only be submitted against a nature with an ACTIVE
              version.
            </TableMessage>
          ) : null}

          {versions.map((version) => (
            <Tr key={version.nature_id}>
              {showName ? <Td className="font-medium">{version.label}</Td> : null}
              <Td className="font-mono text-[13px]">v{version.version}</Td>
              <Td>
                <StatusPill value={version.status} />
              </Td>
              <Td className="text-ink-muted">
                <Timestamp value={version.created_at} />
              </Td>
              <Td>
                {onStatusChange ? (
                  <div className="flex gap-2">
                    {version.status === "ACTIVE" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pendingVersion === version.version}
                        onClick={() => onStatusChange(version.version, "INACTIVE")}
                      >
                        Retire
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pendingVersion === version.version}
                        onClick={() => onStatusChange(version.version, "ACTIVE")}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                ) : null}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  );
}
