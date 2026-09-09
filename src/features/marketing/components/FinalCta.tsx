import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.08] bg-deep">
      <div aria-hidden className="aurora-field absolute inset-0 opacity-70">
        <span className="aurora-third" />
      </div>

      <div className="relative mx-auto max-w-[1120px] px-4 py-24 text-center">
        <Reveal>
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-balance text-ink sm:text-[3rem] sm:leading-[1.08]">
            Put the verdict where the <span className="text-gradient">decision</span> gets made.
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-muted">
            Create an account, issue a key, and run your first verification from the browser. Keys
            authenticate once a LensAI administrator approves them.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-r from-viv-indigo to-viv-violet px-7 text-[15px] font-semibold text-white shadow-[0_10px_40px_-10px_rgb(99_102_241/0.8)] transition-transform duration-150 hover:scale-[1.02] active:scale-100"
            >
              Create an account
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>
            <Link
              href="/docs/quickstart"
              className="inline-flex h-12 items-center rounded-lg border border-white/15 bg-white/[0.06] px-7 text-[15px] font-medium text-ink backdrop-blur transition-colors hover:border-white/25 hover:bg-white/[0.12]"
            >
              Quickstart
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
