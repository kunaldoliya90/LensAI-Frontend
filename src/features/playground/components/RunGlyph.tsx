import { cn } from "@/lib/cn";
import type { RunMark } from "../runPhases";

/** MATCH / MISMATCH / NOT_VERIFIABLE, as the tick's colour. */
const TICK: Record<string, string> = {
  MATCH: "text-pass",
  MISMATCH: "text-fail",
  NOT_VERIFIABLE: "text-warn",
  NOT_SPECIFIED: "text-ink-subtle",
};

/**
 * The document, stood in for.
 *
 * Deliberately a skeleton and not a preview: the console never fetches the
 * bytes, so drawing anything that looked like the real page would be a picture
 * of a document nobody has seen. What is real is the *marks* — one row per
 * field the worker has actually compared, stamped in the order it compared
 * them, coloured by the outcome it recorded.
 *
 * Before the first comparison lands there is nothing to draw, so it holds four
 * placeholder lines. They read as a skeleton, which is what they are.
 */
export function RunGlyph({
  marks,
  scanning,
  receding,
  hue,
}: {
  marks: RunMark[];
  /** A stage the user cannot see through is running. */
  scanning: boolean;
  /** The verdict is being resolved; the document steps back. */
  receding: boolean;
  hue: string;
}) {
  const rows = marks.length > 0 ? marks : null;

  return (
    <div
      className={cn(
        "relative h-[146px] w-[116px] overflow-hidden rounded-[10px] border border-line-strong",
        "bg-[image:var(--panel)] shadow-lg transition-[transform,opacity,filter] duration-700",
        receding ? "scale-90 opacity-25 blur-[3px]" : "scale-100 opacity-100 blur-0",
      )}
    >
      {scanning ? (
        <span
          aria-hidden
          className="stage-sweep absolute inset-x-0 top-0 h-[24%]"
          style={{
            backgroundImage: `linear-gradient(180deg, transparent, ${hue}3d)`,
            borderBottom: `1px solid ${hue}`,
            boxShadow: `0 0 26px ${hue}66`,
          }}
        />
      ) : null}

      <div className="relative grid gap-2.5 px-3.5 py-4">
        {(rows ?? [null, null, null, null]).map((mark, index) => (
          <div
            key={mark ? mark.field : `pending-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_9px] items-center gap-1.5"
          >
            <span
              className={cn(
                "h-[5px] rounded-[3px] transition-opacity duration-300",
                mark ? "bg-ink-subtle opacity-100" : "bg-ink-subtle opacity-25",
              )}
            />
            {mark ? (
              <svg
                viewBox="0 0 12 12"
                aria-hidden
                className={cn("stamp size-[9px]", TICK[mark.matchStatus] ?? "text-ink-subtle")}
              >
                {mark.matchStatus === "MISMATCH" ? (
                  <path
                    d="M3 3 L9 9 M9 3 L3 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M2 6.4 L4.6 9 L10 3.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <span className="absolute right-2 bottom-1.5 font-mono text-[9px] text-ink-subtle">
        {marks.length > 0 ? `${marks.length} checked` : "—"}
      </span>
    </div>
  );
}
