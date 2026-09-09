import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  tone = "light",
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
  /** `deep` for the dark marketing surfaces. */
  tone?: "light" | "deep";
  className?: string;
}) {
  const deep = tone === "deep";

  return (
    <section
      id={id}
      className={cn(
        "relative border-t",
        deep ? "border-white/[0.08] bg-deep text-ink" : "border-line",
        className,
      )}
    >
      <div className="relative mx-auto max-w-[1120px] px-4 py-16 sm:py-20">
        <Reveal>
          {eyebrow ? (
            <p
              className={cn(
                "text-[11px] font-semibold tracking-[0.14em] uppercase",
                deep ? "text-viv-cyan" : "text-accent-bright",
              )}
            >
              {eyebrow}
            </p>
          ) : null}

          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[2.35rem] sm:leading-[1.12]">
            {title}
          </h2>

          {lead ? (
            <div className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted">{lead}</div>
          ) : null}
        </Reveal>

        {children ? <div className="mt-10">{children}</div> : null}
      </div>
    </section>
  );
}
