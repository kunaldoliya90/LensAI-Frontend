import { Info, TriangleAlert } from "lucide-react";
import { EvidenceModel } from "./EvidenceModel";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { IntegrationBand } from "./IntegrationBand";
import { Section } from "./Section";
import { StatsBand } from "./StatsBand";
import { TrustRow } from "./TrustRow";
import { VerdictGrid } from "./VerdictGrid";

export function Landing() {
  return (
    <>
      <Hero />
      <StatsBand />
      <HowItWorks />
      <IntegrationBand />
      <EvidenceModel />
      <TrustRow />

      <Section
        tone="deep"
        eyebrow="Verdicts"
        title="Four outcomes, and one of them is a trap."
        lead="Every result is one of these. They are the vocabulary your reviewers will use, so the API refuses to blur them."
      >
        <VerdictGrid />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-viv-amber/25 bg-viv-amber/[0.08] p-4">
            <TriangleAlert
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-viv-amber"
              strokeWidth={2}
            />
            <div className="text-[13.5px] leading-relaxed text-ink-muted">
              <p className="font-semibold text-viv-amber">NOT_SPECIFIED is not a pass</p>
              <p className="mt-1">
                It means the document could not be read, so there was nothing to compare. Route it
                to a human. Filing it as compliant is the single most costly way to misread this
                API.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-viv-cyan" strokeWidth={2} />
            <div className="text-[13.5px] leading-relaxed text-ink-muted">
              <p className="font-semibold text-ink">A verdict only exists once the pipeline ran</p>
              <p className="mt-1">
                <code className="font-mono text-[13px] text-ink">job_status</code> answers
                &ldquo;did the pipeline run?&rdquo; and{" "}
                <code className="font-mono text-[13px] text-ink">verdict</code> answers
                &ldquo;what did it conclude?&rdquo;. An ERRORED job carries no verdict at all.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
