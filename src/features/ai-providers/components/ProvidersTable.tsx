import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import type { ProviderSummary } from "@/lib/api/types";

export function ProvidersTable({
  providers,
  defaultProviderId,
  loading,
  busyProviderId,
  onHealthCheck,
  onSetDefault,
  onDisable,
}: {
  providers: ProviderSummary[];
  defaultProviderId: string | null;
  loading: boolean;
  busyProviderId: string | null;
  onHealthCheck: (providerId: string) => void;
  onSetDefault: (providerId: string) => void;
  onDisable: (providerId: string) => void;
}) {
  return (
    <TableScroll>
      <Table className="min-w-[64rem]">
        <thead>
          <Tr>
            <Th>Name</Th>
            <Th>Adapter</Th>
            <Th>Model</Th>
            <Th>Status</Th>
            <Th>Last health check</Th>
            <Th>Health error</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </Tr>
        </thead>
        <tbody>
          {loading ? <TableMessage columns={7}>Loading providers…</TableMessage> : null}

          {!loading && providers.length === 0 ? (
            <TableMessage columns={7}>
              No provider registered. Documents are processed by the LensAI platform model.
            </TableMessage>
          ) : null}

          {providers.map((provider) => {
            const isDefault = provider.provider_id === defaultProviderId;
            const busy = busyProviderId === provider.provider_id;

            return (
              <Tr key={provider.provider_id}>
                <Td className="font-medium">
                  {provider.name}
                  {isDefault ? (
                    <span className="ml-2">
                      <Pill tone="info">Default</Pill>
                    </span>
                  ) : null}
                </Td>
                <Td className="font-mono text-[12px]">{provider.adapter}</Td>
                <Td className="font-mono text-[12px]">{provider.model}</Td>
                <Td>
                  <StatusPill value={provider.status} />
                </Td>
                <Td className="text-ink-muted">
                  <Timestamp value={provider.last_health_check_at} />
                </Td>
                <Td className="max-w-[26ch] text-[13px] text-fail">
                  {provider.last_health_error ?? "—"}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => onHealthCheck(provider.provider_id)}
                    >
                      Health check
                    </Button>
                    {!isDefault && provider.status !== "INACTIVE" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => onSetDefault(provider.provider_id)}
                      >
                        Set default
                      </Button>
                    ) : null}
                    {provider.status !== "INACTIVE" ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => onDisable(provider.provider_id)}
                      >
                        Disable
                      </Button>
                    ) : null}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </TableScroll>
  );
}
