import { ArrowRight, Cpu, FileKey2, Lock } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "./Section";

const GUARANTEES = [
  {
    icon: FileKey2,
    accent: "from-viv-sky/20 to-viv-cyan/5",
    iconColor: "text-viv-cyan",
    title: "Signed webhooks",
    body: "Every delivery carries X-LensAI-Signature: t=<unix>,v1=<hex>, an HMAC-SHA256 over {timestamp}.{raw body}. Rotation sends both secrets for 24 hours so you can deploy the new one without a cutover.",
    href: "/docs/webhooks",
  },
  {
    icon: Lock,
    accent: "from-viv-indigo/20 to-viv-violet/5",
    iconColor: "text-viv-indigo",
    title: "Row-level tenant isolation",
    body: "Every API key resolves to one tenant, and the database session behind the request has row-level security applied. A key for one account cannot read another's rows.",
    href: "/docs/authentication",
  },
  {
    icon: Cpu,
    accent: "from-viv-emerald/20 to-viv-cyan/5",
    iconColor: "text-viv-emerald",
    title: "STRICT by default on your own model",
    body: "Point LensAI at your AI endpoint and STRICT means exactly that: if your provider is unavailable, jobs fail rather than quietly running on ours. Falling back is something you opt into.",
    href: "/docs/byom",
  },
];

export function TrustRow() {
  return (
    <Section
      tone="deep"
      eyebrow="Guarantees"
      title="The three things a compliance team asks about first."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {GUARANTEES.map((item, index) => (
          <Reveal key={item.title} delay={index * 110}>
            <div
              className={`group h-full rounded-xl border border-white/10 bg-gradient-to-br ${item.accent} p-6 transition-all duration-200 hover:-translate-y-1 hover:border-white/20`}
            >
              <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-deep-2">
                <item.icon aria-hidden className={`size-[18px] ${item.iconColor}`} strokeWidth={2} />
              </span>

              <h3 className="mt-4 text-[15px] font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{item.body}</p>

              <Link
                href={item.href}
                className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink hover:text-viv-cyan"
              >
                Read the detail
                <ArrowRight
                  aria-hidden
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
