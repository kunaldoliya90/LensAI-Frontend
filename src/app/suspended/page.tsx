import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

export const metadata: Metadata = {
  title: "Account suspended",
};

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Logo />

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight">This account is suspended</h1>

          <Callout tone="fail" className="mt-4">
            {message ?? "This account is suspended. Please contact your LensAI administrator."}
          </Callout>

          <p className="mt-4 text-sm text-ink-muted">
            Suspension blocks every API call for the tenant from the next request. Your API keys and
            your data are untouched — nothing has been deleted, and access is restored the moment a
            LensAI administrator reactivates the account.
          </p>

          <p className="mt-2 text-sm text-ink-muted">
            Because the authentication record is cached briefly, a key may keep working for a short
            period after a status change in either direction.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/login" className={buttonClass({ variant: "secondary" })}>
              Back to sign in
            </Link>
            <Link href="/docs/errors" className={buttonClass({ variant: "secondary" })}>
              Error reference
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
