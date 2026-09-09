import Link from "next/link";

export function Logo({
  href = "/",
  subtitle,
  variant = "brand",
}: {
  href?: string;
  subtitle?: string;
  /** `console` swaps the vivid brand square for the design's neutral chip. The
   *  gradient square is a marketing colour: on the console's warm paper it
   *  reads as a sticker stuck to the page rather than part of it. */
  variant?: "brand" | "console";
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2">
      {variant === "console" ? (
        <span className="mark grid size-7 shrink-0 place-items-center rounded-[8px] border border-line-strong">
          <svg viewBox="0 0 32 32" aria-hidden className="size-[17px]">
            <circle
              cx="14"
              cy="14"
              r="6.75"
              fill="none"
              className="stroke-accent"
              strokeWidth="2.6"
            />
            <path
              d="M19.4 19.4 L25 25"
              className="stroke-ink"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ) : (
        <svg viewBox="0 0 32 32" aria-hidden className="size-7">
          <defs>
            <linearGradient id="lensai-mark" x1="0" y1="0" x2="32" y2="32">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#lensai-mark)" />
          <circle cx="14" cy="14" r="6.75" fill="none" stroke="white" strokeWidth="2.5" />
          <path d="M19.4 19.4 L25 25" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        LensAI
        {subtitle ? <span className="ml-1.5 font-normal text-ink-muted">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
