"use client";

import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { CopyValue } from "@/components/ui/CopyValue";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "@/lib/api/types";
import { isStaff, playgroundKeyStore } from "@/lib/auth/session";
import { usePlaygroundApiKey, useSession } from "@/lib/auth/useSession";
import { formatDateTime } from "@/lib/format";

export function ConsoleSettings() {
  const session = useSession();
  const playgroundKey = usePlaygroundApiKey();

  if (!session) return null;

  const staff = isStaff(session);
  const superAdmin = session.role === "SUPER_ADMIN";

  return (
    <>
      <PageHeader
        title="Settings"
        description={
          staff
            ? "Your staff identity, and what it is permitted to manage."
            : "Who this session belongs to, and what the browser is holding on its behalf."
        }
      />

      <section className="panel p-4">
        <h2 className="text-[12.5px] font-medium">Session</h2>
        {/* Capped, because a two-column definition list inside a full-width
            panel put "Email" at x270 and "Role" at x845 on a 1440 screen — far
            enough apart that they read as two unrelated columns rather than one
            list. The panel still spans the page; its contents do not. */}
        <dl className="mt-3 grid max-w-3xl gap-x-10 gap-y-5 sm:grid-cols-2">
          <div>
            <dt className="text-[13px] text-ink-muted">Email</dt>
            <dd className="mt-0.5 text-sm">{session.email}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-muted">Role</dt>
            <dd className="mt-0.5">
              <Pill tone={staff ? "info" : "neutral"}>{session.role}</Pill>
            </dd>
          </div>
          {!staff ? (
            <div>
              <dt className="text-[13px] text-ink-muted">tenant_id</dt>
              <dd className="mt-0.5">
                <CopyValue value={session.tenantId} />
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[13px] text-ink-muted">user_id</dt>
            <dd className="mt-0.5">
              <CopyValue value={session.userId} />
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-ink-muted">Session ends</dt>
            <dd className="mt-0.5 text-sm">
              {formatDateTime(new Date(session.expiresAt).toISOString())}
            </dd>
          </div>
        </dl>
      </section>

      {staff ? (
        <section className="panel p-4">
          <h2 className="text-[12.5px] font-medium">Permissions</h2>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
            {superAdmin
              ? "The super admin holds every scope implicitly — it is never itself stored as a grant."
              : "Granted by the super admin, and re-read from the database on every request."}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ALL_PERMISSIONS.map((permission) => {
              const granted = superAdmin || session.permissions.includes(permission);
              return (
                <Pill key={permission} tone={granted ? "pass" : "neutral"}>
                  {PERMISSION_LABELS[permission]}
                </Pill>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="panel p-4">
        <h2 className="text-[12.5px] font-medium">Playground API key</h2>
        <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
          Held in this tab&rsquo;s sessionStorage only, and used solely as the{" "}
          <code className="font-mono text-[12px]">x-api-key</code> header on playground calls.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm">
            {playgroundKey ? (
              <code className="font-mono text-[13px]">
                {playgroundKey.slice(0, 8)}…{playgroundKey.slice(-4)}
              </code>
            ) : (
              <span className="text-ink-muted">No key stored.</span>
            )}
          </span>
          {playgroundKey ? (
            <Button variant="secondary" size="sm" onClick={() => playgroundKeyStore.clear()}>
              Forget key
            </Button>
          ) : null}
        </div>
      </section>

      <Callout tone="neutral" title="What this console deliberately does not offer">
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>No password change or reset — the API has no endpoint for either.</li>
          {!superAdmin ? (
            <li>
              {staff
                ? "No self-service second admin: only the super admin can create one, from Admins."
                : "No inviting a second user: signup creates one first user and there is no invite route."}
            </li>
          ) : null}
          <li>No session refresh. When the token expires you sign in again.</li>
          <li>No email verification, SSO or 2FA.</li>
        </ul>
        <p className="mt-2">
          These are absent because the backend does not implement them, not because they are hidden.
        </p>
      </Callout>
    </>
  );
}
