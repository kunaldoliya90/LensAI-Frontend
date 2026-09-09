import { Suspense } from "react";
import { ReferenceDataEditor } from "@/features/reference-data/components/ReferenceDataEditor";

export default async function ReferenceDataDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;

  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <ReferenceDataEditor tableKey={decodeURIComponent(key)} />
    </Suspense>
  );
}
