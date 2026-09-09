import { RequireSession } from "@/features/auth/components/RequireSession";
import { ConsoleShell } from "@/features/console/components/ConsoleShell";
import { QueryProvider } from "@/lib/api/QueryProvider";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <RequireSession>
        <ConsoleShell>{children}</ConsoleShell>
      </RequireSession>
    </QueryProvider>
  );
}
