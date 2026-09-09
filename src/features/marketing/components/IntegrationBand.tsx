import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/CodeBlock";

const SUBMIT = `curl -X POST $LENSAI/verifications \\
  -H "x-api-key: $KEY" \\
  -H "Idempotency-Key: EVD233_19_883" \\
  -d '{
    "reference_id": "EVD233_19_883",
    "template": "challan",
    "documents": [{"type": "document_id", …}],
    "expected_values": {
      "company_name": "Acme India Pvt. Ltd.",
      "challan_amount": "45200"
    }
  }'`;

const DELIVERED = `POST /webhooks/lensai
X-LensAI-Signature: t=1786571506,v1=9f2c1a7b…
X-LensAI-Event-Id: evt_9f2c1a7b5e4d4c8f

{
  "event_type": "verification.completed",
  "data": {
    "reference_id": "EVD233_19_883",
    "verdict": "PASS",
    "confidence_score": "100.00"
  }
}`;

export function IntegrationBand() {
  return (
    <section className="relative overflow-hidden bg-deep text-ink">
      <div aria-hidden className="grid-field-deep absolute inset-0" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgb(75 131 240 / 0.22), transparent)" }}
      />

      <div className="relative mx-auto max-w-[1120px] px-4 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-accent-bright uppercase">
            The integration
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[2.5rem] sm:leading-[1.1]">
            One request out. One signed result back.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            There is no SDK to adopt and no schema to agree on. You send an identifier you already
            have; we echo it back untouched on every result, so the join into your database is a
            single column.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-5 lg:grid-cols-[1fr_auto_1fr]">
          <CodeBlock language="bash" tone="deep">
            {SUBMIT}
          </CodeBlock>

          <div className="flex items-center justify-center lg:h-full lg:flex-col">
            <span className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
              <ArrowRight aria-hidden className="size-4 text-accent-bright" strokeWidth={2} />
            </span>
          </div>

          <CodeBlock language="http" tone="deep">
            {DELIVERED}
          </CodeBlock>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-[13px] text-ink-muted">
          <span>7 delivery attempts over ~12 hours</span>
          <span>Dead letters stay replayable</span>
          <span>
            <code className="font-mono text-ink">GET /verifications/{"{id}"}</code> is always
            the fallback
          </span>
          <Link
            href="/docs/webhooks"
            className="ml-auto inline-flex items-center gap-1.5 font-medium text-accent-bright hover:underline"
          >
            Webhook contract
            <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
