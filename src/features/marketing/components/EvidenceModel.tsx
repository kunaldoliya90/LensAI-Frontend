import { Clock, EyeOff, Link2Off } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "./Section";

const POINTS = [
  {
    icon: Link2Off,
    accent: "text-viv-sky",
    ring: "group-hover:border-viv-sky/40",
    title: "Fetched once, never stored",
    body: "Your document is fetched a single time, at processing time, over a connection that refuses private, loopback and cloud-metadata addresses. We never write the bytes to storage of our own.",
  },
  {
    icon: Clock,
    accent: "text-viv-violet",
    ring: "group-hover:border-viv-violet/40",
    title: "The file leaves; the answer stays",
    body: "There is nothing to expire, because there is never a copy to begin with. Verdicts, extracted fields and per-field check results are what we keep, so a record from last year still explains itself.",
  },
  {
    icon: EyeOff,
    accent: "text-viv-emerald",
    ring: "group-hover:border-viv-emerald/40",
    title: "No second copy of your evidence store",
    body: "LensAI holds nothing of yours to serve back, upload or otherwise. We verify a document once and keep the answer, not a copy of the file.",
  },
];

export function EvidenceModel() {
  return (
    <Section
      tone="deep"
      eyebrow="Evidence model"
      title="A verification service, not a hosted document viewer."
      lead="The distinction decides what you have to expose, and what still exists a year from now."
    >
      <div className="grid gap-5 md:grid-cols-3">
        {POINTS.map((point, index) => (
          <Reveal key={point.title} delay={index * 110}>
            <div
              className={`group h-full rounded-xl border border-white/10 bg-white/[0.035] p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.06] ${point.ring}`}
            >
              <point.icon
                aria-hidden
                className={`size-5 ${point.accent}`}
                strokeWidth={1.9}
              />
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{point.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{point.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
