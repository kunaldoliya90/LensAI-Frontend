import { FileUp, Send, SquareCheckBig } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "./Section";

const STEPS = [
  {
    icon: FileUp,
    accent: "from-viv-sky to-viv-cyan",
    title: "Send the document",
    body: "Pass a URL — S3, a presigned link, a Google Drive share — and we fetch it once at processing time. Nothing of yours sits in our storage.",
    href: "/docs/uploading",
    linkLabel: "Submitting documents",
  },
  {
    icon: SquareCheckBig,
    accent: "from-viv-indigo to-viv-violet",
    title: "Submit the values you expect",
    body: "POST /verifications returns 202 with a queued job. Send an Idempotency-Key and a retry is deduplicated instead of re-run — you get 200 and the original job back.",
    href: "/docs/verifications",
    linkLabel: "Submitting a verification",
  },
  {
    icon: Send,
    accent: "from-viv-violet to-viv-rose",
    title: "Take the result",
    body: "We POST a signed verification.completed event to your endpoint. Miss it and GET /verifications/{id} returns the same answer — webhooks are the convenience, polling is the guarantee.",
    href: "/docs/webhooks",
    linkLabel: "Webhook contract",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      tone="deep"
      eyebrow="How it works"
      title="Three calls, and the answer lands in your system."
      lead="Your backend integrates against the API. The console is where a human issues keys, edits templates and reads delivery history — it is not a place your documents pass through."
    >
      {/* The connector, with a pulse travelling along it. */}
      <div aria-hidden className="beam-line mx-auto mb-8 hidden h-px w-[86%] bg-white/10 md:block" />

      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 110}>
            <li className="group h-full rounded-xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <span
                  className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${step.accent} shadow-lg`}
                >
                  <step.icon aria-hidden className="size-[18px] text-white" strokeWidth={2} />
                </span>
                <span className="font-mono text-[12px] text-ink-muted">0{index + 1}</span>
              </div>

              <h3 className="mt-4 text-[15px] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{step.body}</p>

              <Link
                href={step.href}
                className="mt-4 inline-block text-[13.5px] font-medium text-viv-cyan hover:underline"
              >
                {step.linkLabel}
              </Link>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
