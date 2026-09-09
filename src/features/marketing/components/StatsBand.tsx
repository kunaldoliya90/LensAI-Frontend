import { Reveal } from "@/components/ui/Reveal";

/**
 * Real platform limits, not invented traction numbers. Every figure here is a
 * constant in the backend, so it can be checked rather than believed.
 */
const STATS = [
  { value: "7", unit: "delivery attempts", note: "over roughly 12 hours, then replayable" },
  { value: "20", unit: "documents per job", note: "ordered; first non-empty value wins" },
  { value: "50", unit: "MB per upload", note: "PDF, PNG, JPEG or WebP" },
  { value: "3,000", unit: "requests / minute", note: "per key, at the high tier" },
];

export function StatsBand() {
  return (
    <section className="border-t border-white/[0.08] bg-deep-2">
      <div className="mx-auto grid max-w-[1120px] gap-px overflow-hidden px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <Reveal key={stat.unit} delay={index * 90}>
            <div className="px-2">
              <p className="text-[2.25rem] leading-none font-semibold tracking-[-0.03em] text-transparent bg-gradient-to-br from-viv-sky to-viv-violet bg-clip-text">
                {stat.value}
              </p>
              <p className="mt-2 text-[13.5px] font-medium text-ink">{stat.unit}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{stat.note}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
