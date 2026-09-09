import { DocsSidebar } from "@/features/docs/components/DocsSidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-4 py-10 lg:flex-row lg:gap-12">
      <DocsSidebar />
      <article className="doc-prose min-w-0 max-w-3xl flex-1">{children}</article>
    </div>
  );
}
