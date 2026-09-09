import { Suspense } from "react";
import { Playground } from "@/features/playground/components/Playground";

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <Playground />
    </Suspense>
  );
}
