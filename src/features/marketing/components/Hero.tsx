import { ArrowRight, FileCheck2, ShieldCheck, Webhook } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { VerdictRunShowcase } from "./VerdictRunShowcase";

const FACTS = [
  { icon: FileCheck2, text: "Upload the bytes, or pass a URL" },
  { icon: ShieldCheck, text: "Signed, at-least-once delivery" },
  { icon: Webhook, text: "Polling fallback, always" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-deep text-ink">
      <div aria-hidden className="aurora-field absolute inset-0">
        <span className="aurora-third" />
      </div>
      <div aria-hidden className="grid-field-deep absolute inset-0" />

      {/* The single mobile column is explicit: an implicit grid column sizes to
          its widest child, and the section clips rather than scrolls, so a wide
          card silently cut the copy off at the right edge. */}
      <div className="relative mx-auto grid max-w-[1120px] grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 pt-20 pb-24 lg:grid-cols-[1.05fr_minmax(0,27rem)] lg:pt-24 lg:pb-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-ink backdrop-blur">
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-viv-cyan opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-viv-cyan" />
            </span>
            Document verification API
          </span>

          {/* No forced line break: at 44px "Write the verdict in" is wider than
              a 390px viewport and pushes the whole page into horizontal scroll. */}
          <h1 className="mt-6 text-[2rem] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-[2.75rem] sm:leading-[1.02] lg:text-[3.75rem]">
            Verify documents. Write the verdict in{" "}
            <span className="text-gradient">your</span> database.
          </h1>

          <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-ink-muted">
            Submit a file and the values you expect. LensAI extracts, compares, and POSTs a signed
            result — with per-field evidence behind every verdict. We never touch your DB.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-viv-indigo to-viv-violet px-6 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgb(99_102_241/0.8)] transition-transform duration-150 hover:scale-[1.02] active:scale-100"
            >
              Get started
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>
            <Link
              href="/docs"
              className={buttonClass({
                size: "lg",
                className:
                  "h-12 border-white/15 bg-white/[0.06] px-6 text-ink shadow-none backdrop-blur hover:border-white/25 hover:bg-white/[0.12]",
              })}
            >
              Read the docs
            </Link>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6">
            {FACTS.map((fact) => (
              <li
                key={fact.text}
                className="flex items-center gap-2 text-[13px] text-ink-muted"
              >
                <fact.icon aria-hidden className="size-4 shrink-0 text-viv-cyan" strokeWidth={1.9} />
                {fact.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="float-slow lg:pl-4">
          <VerdictRunShowcase />
        </div>
      </div>
    </section>
  );
}
