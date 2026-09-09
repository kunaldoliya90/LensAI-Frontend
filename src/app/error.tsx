"use client";

import Link from "next/link";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Logo } from "@/components/Logo";
import { Button, buttonClass } from "@/components/ui/Button";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Logo />

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-xl">
          <h1 className="text-2xl font-semibold tracking-tight">Something failed on this page</h1>
          <p className="mt-2 text-sm text-ink-muted">
            The detail below is what the browser was told. If it carries a correlation id, quote it
            to LensAI support and the exact request can be found in the logs.
          </p>

          <div className="mt-4">
            <ErrorNotice error={error} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={reset}>Try again</Button>
            <Link href="/app" className={buttonClass({ variant: "secondary" })}>
              Back to the console
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
