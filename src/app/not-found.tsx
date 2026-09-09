import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Logo />

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="max-w-lg text-center">
          <p className="font-mono text-sm text-ink-muted">404</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page does not exist</h1>
          <p className="mt-2 text-sm text-ink-muted">
            The link may be out of date. The documentation index and the console are both a click
            away.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/" className={buttonClass({ variant: "secondary" })}>
              Home
            </Link>
            <Link href="/docs" className={buttonClass({ variant: "secondary" })}>
              Documentation
            </Link>
            <Link href="/app" className={buttonClass()}>
              Console
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
