import { FileCheck2, Cpu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";

const POINTS = [
  {
    icon: FileCheck2,
    text: "Submit a document and the values you expect; take back a verdict with per-field evidence.",
  },
  {
    icon: ShieldCheck,
    text: "Signed webhooks, at-least-once delivery, and a polling fallback that makes them safe to rely on.",
  },
  {
    icon: Cpu,
    text: "Bring your own model under a STRICT data policy, so documents never reach the platform model.",
  },
];

const RESULT_SAMPLE = `{
  "reference_id": "EVD233_19_883",
  "job_status": "COMPLETED",
  "verdict": "PASS",
  "checks": [
    {
      "field_name": "company_name",
      "match_status": "MATCH",
      "severity": "mandatory"
    }
  ]
}`;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <RedirectIfAuthenticated>{children}</RedirectIfAuthenticated>
          </div>
        </div>
        <p className="text-sm text-ink-muted">
          <Link href="/" className="hover:text-ink">
            ← Back to lensai.com
          </Link>
        </p>
      </div>

      <aside className="relative hidden flex-col justify-center overflow-hidden border-l border-line bg-deep px-12 lg:flex">
        <div aria-hidden className="aurora-field absolute inset-0 opacity-60">
          <span className="aurora-third" />
        </div>
        <div className="relative">
        <p className="text-[11px] font-semibold tracking-wide text-accent-bright uppercase">
          Document verification infrastructure
        </p>
        <p className="mt-3 max-w-md text-xl font-semibold tracking-tight text-balance">
          The verdict goes into your database. Nothing comes back the other way.
        </p>
        <ul className="mt-6 grid max-w-md gap-3.5 text-[13.5px] leading-relaxed text-ink-muted">
          {POINTS.map((point) => (
            <li key={point.text} className="flex gap-2.5">
              <point.icon
                aria-hidden
                className="mt-0.5 size-4 shrink-0 text-accent-bright"
                strokeWidth={1.9}
              />
              {point.text}
            </li>
          ))}
        </ul>

        <div className="mt-8 max-w-md">
          <CodeBlock language="json">{RESULT_SAMPLE}</CodeBlock>
        </div>

          <Link
            href="/docs/quickstart"
            className="mt-6 inline-block text-[13.5px] text-accent-bright underline underline-offset-2"
          >
            Read the quickstart
          </Link>
        </div>
      </aside>
    </div>
  );
}
