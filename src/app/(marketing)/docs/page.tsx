import Link from "next/link";
import type { Metadata } from "next";
import { DOCS_SECTIONS } from "@/features/docs/docsNav";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "How to integrate LensAI: authentication, uploading documents, submitting verifications, receiving signed webhooks, and configuring templates.",
};

export default function DocsHubPage() {
  return (
    <>
      <h1>Documentation</h1>
      <p>
        LensAI verifies a document against the values you already believe it contains, and returns a
        verdict to your systems. Your backend integrates against the API; nothing here requires you
        to expose a database, a network path, or a public URL for the document itself.
      </p>

      <p>
        New here? Read <Link href="/docs/quickstart">Quickstart</Link>, then{" "}
        <Link href="/docs/webhooks">Webhooks</Link> — the three webhook rules are the part that
        decides whether an integration is correct under retries.
      </p>

      {DOCS_SECTIONS.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="lift rounded-lg border border-line bg-ground p-4 no-underline shadow-xs"
              >
                <span className="font-medium text-ink">{item.label}</span>
                <span className="mt-1 block text-sm text-ink-muted">{item.summary}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
