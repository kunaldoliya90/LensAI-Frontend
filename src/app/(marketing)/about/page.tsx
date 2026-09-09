import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { Section } from "@/features/marketing/components/Section";

export const metadata: Metadata = {
  title: "About",
  description:
    "LensAI is verification infrastructure: it returns a verdict to your systems rather than becoming a place your documents live.",
};

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-[1120px] px-4 py-16">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Verification infrastructure, not a document management system.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-muted">
          LensAI answers one question — does this document say what you were told it says — and
          returns the answer to the system that asked. It is deliberately not a place your evidence
          lives.
        </p>
      </section>

      <Section
        eyebrow="The model"
        title="The verdict goes to you. Nothing comes back the other way."
        className="bg-surface"
      >
        <div className="grid gap-4 text-[15px] md:grid-cols-2">
          <div className="grid gap-3">
            <p>
              Your backend submits a document and the values you already believe it contains. LensAI
              extracts what the document actually says, compares the two field by field, and POSTs a
              signed result to an endpoint you registered. Your code writes it into your database.
            </p>
            <p>
              LensAI never connects to your database. We hold no credentials of yours, we are not
              inside your network, and your schema is your business. The join key is{" "}
              <code className="font-mono text-[13px]">reference_id</code> — your own identifier,
              which you send us and we echo back untouched.
            </p>
          </div>
          <div className="grid gap-3">
            <p>
              Webhook delivery is a convenience, not a dependency. Every result stays retrievable
              from <code className="font-mono text-[13px]">GET /verifications/{"{id}"}</code>, and{" "}
              <code className="font-mono text-[13px]">updated_since</code> lets you sweep for
              anything you missed after an outage. A missed webhook is never lost data.
            </p>
            <p>
              This console is the human surface around that API: issue keys, edit templates, read
              delivery history, reconcile usage. Integrations still run from your servers.
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Accounts" title="One tenant, many clients, two environments.">
        <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
          <div className="bg-ground p-5">
            <dt className="font-semibold">Tenant</dt>
            <dd className="mt-2 text-sm text-ink-muted">
              Your company account. Every row in the database is scoped to it, and the database
              session behind each request has row-level security applied — a key for one tenant
              cannot read another&rsquo;s data.
            </dd>
          </div>
          <div className="bg-ground p-5">
            <dt className="font-semibold">Client</dt>
            <dd className="mt-2 text-sm text-ink-muted">
              Your own customer, subsidiary or business unit. Jobs, uploads and webhook endpoints
              all hang off a <code className="font-mono text-[13px]">client_id</code>, so one
              account can serve many downstream parties without mixing their evidence.
            </dd>
          </div>
          <div className="bg-ground p-5">
            <dt className="font-semibold">Environment</dt>
            <dd className="mt-2 text-sm text-ink-muted">
              <strong>SANDBOX</strong> or <strong>PRODUCTION</strong> is an attribute of the API
              key, not a separate deployment. Rate limits are set per key when an administrator
              approves it.
            </dd>
          </div>
        </dl>

        <Callout tone="neutral" title="Keys are approved by a person" className="mt-4">
          A new key is issued <code className="font-mono text-[13px]">PENDING</code> and does not
          authenticate until a LensAI administrator approves it. That step is a deliberate control
          on who can submit compliance evidence, not an onboarding delay we forgot to remove.
        </Callout>
      </Section>

      <Section
        eyebrow="Your model, your data"
        title="STRICT means your documents never reach our model."
        className="bg-surface"
      >
        <div className="grid gap-4 text-[15px] md:grid-cols-2">
          <div className="grid gap-3">
            <p>
              You can point LensAI at your own AI endpoint — Azure OpenAI, OpenAI, or anything
              speaking the same API. From then on, extraction runs there.
            </p>
            <p>
              The interesting case is not the happy one. If your endpoint goes down and we quietly
              fell back to ours, your jobs would succeed, dashboards would stay green, and the one
              guarantee you bought would be broken with nothing recording it.
            </p>
          </div>
          <div className="grid gap-3">
            <p>
              So <strong>STRICT</strong> is the default and it is literal: when your provider is
              unusable, jobs fail with{" "}
              <code className="font-mono text-[13px]">no_provider_configured</code> and no document
              is sent anywhere at all — the provider is resolved before anything is fetched or read.
            </p>
            <p>
              Falling back is opt-in, recorded against the user who chose it, and every completed
              verification stores which provider produced it.{" "}
              <Link href="/docs/byom" className="text-accent-bright underline underline-offset-2">
                How it works
              </Link>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Retention" title="The file leaves. The answer stays.">
        <div className="max-w-3xl space-y-3 text-[15px]">
          <p>
            Uploaded documents are held for your account&rsquo;s retention window and then removed
            by a sweep that runs hourly — enforced, not promised. The{" "}
            <code className="font-mono text-[13px]">expires_at</code> on every upload tells you
            exactly when.
          </p>
          <p>
            Verdicts, extracted fields, per-field check results and the full pipeline trace outlive
            the file. A compliance record from last year still explains itself, against the exact
            template version and reference data that produced it, without the original document
            having to sit in our storage forever.
          </p>
          <p>
            We also do not serve the bytes back. Document endpoints return metadata only, so LensAI
            never becomes a second distribution channel for evidence you gave us to check.
          </p>
        </div>
      </Section>
    </>
  );
}
