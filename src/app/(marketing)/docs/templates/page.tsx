import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { NATURE_EXAMPLE } from "@/features/natures/natureExample";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "A template is named, versioned JSON: what to extract, what to check, and how those results become a verdict.",
};

export default function TemplatesDocsPage() {
  return (
    <>
      <h1>Templates</h1>
      <p>
        A template is a named, versioned JSON config describing one document type: what to extract,
        which integrity and comparison plugins to run, and how their results become a verdict. It is
        data, not code — adding a document type is a save, not a deploy.
      </p>

      <h2>Four sections</h2>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>extraction</code>
            </td>
            <td>
              Which extractor runs, how the document is rendered, and the <code>fields[]</code> the
              model must return.
            </td>
          </tr>
          <tr>
            <td>
              <code>integrity</code>
            </td>
            <td>Tamper and quality checks on the document itself.</td>
          </tr>
          <tr>
            <td>
              <code>checks</code>
            </td>
            <td>Field-by-field comparisons against your <code>expected_values</code>.</td>
          </tr>
          <tr>
            <td>
              <code>verdict_policy</code>
            </td>
            <td>How the individual results collapse into one verdict.</td>
          </tr>
        </tbody>
      </table>

      <h2>Rules the validator enforces</h2>
      <ul>
        <li>
          <code>extraction.plugin</code> must be <code>extractor.generic</code> — currently the only
          extractor.
        </li>
        <li>
          Every check&rsquo;s <code>field</code> must exist as a{" "}
          <code>extraction.fields[].key</code>. A check on a field nobody extracts can never run.
        </li>
        <li>Every named plugin must exist in the registry below.</li>
      </ul>
      <p>
        <code>POST /portal/templates/validate</code> returns <strong>every</strong> problem at once
        rather than stopping at the first, so the editor shows them together instead of revealing
        them one save at a time.
      </p>

      <h2>Plugin catalog</h2>
      <p>
        The plugins available to you are served by the API itself, from{" "}
        <code>GET /v1/portal/plugins</code> — every extractor, integrity rule and check, with what
        each one is for and which parameters it takes. The{" "}
        <Link href="/app/templates">template editor</Link> builds its form from that response, which
        is why a check added to the platform is usable immediately rather than after a console
        release.
      </p>
      <p>
        This page deliberately does not reproduce the list. A copy here would be a second source of
        truth, and it would be the stale one.
      </p>
      <p>
        Each check takes <code>field</code> (what was extracted), <code>expects</code> (which key of
        your <code>expected_values</code> it compares against), a <code>severity</code>, and
        plugin-specific <code>params</code> such as a fuzzy threshold or a numeric tolerance. Saving
        a template reports any param the named plugin does not read, so a misspelt setting is caught
        rather than silently ignored.
      </p>

      <h2>Versioning</h2>
      <Callout tone="warn" title="Saving always creates a new version">
        A template is never edited in place. A job freezes its{" "}
        <code>config_snapshot</code> at submission, so a past verdict keeps explaining itself with
        the configuration that produced it. Mutating a live template would silently change what a
        stored compliance record means.
      </Callout>

      <p>
        <code>PUT /portal/templates/{"{name}"}</code> writes a new version and, with{" "}
        <code>activate: true</code>, makes it the one new jobs resolve.{" "}
        <code>POST /portal/templates/{"{name}"}/status</code> moves a specific version between{" "}
        <code>DRAFT</code>, <code>ACTIVE</code> and <code>INACTIVE</code>. Nothing is ever deleted,
        because every verification that ran against a version references it.
      </p>

      <h2>Reference data</h2>
      <p>
        A check opts into your own lookup table with{" "}
        <code>&quot;reference_data&quot;: &quot;authority_map&quot;</code> in its params. Checks
        that do not name one keep the built-in defaults, which cover the common Indian statutory
        authorities and every state. Upload your own naming on{" "}
        <Link href="/app/reference-data">Reference data</Link> — it replaces the defaults for your
        account alone, and saving there is also versioned.
      </p>

      <h2>The challan example</h2>
      <p>
        This is what the <strong>Insert example</strong> button loads in the{" "}
        <Link href="/app/templates">template editor</Link>. The field list and the checks are
        consistent with each other, which is the first thing the validator tests.
      </p>

      <CodeBlock language="json">{NATURE_EXAMPLE}</CodeBlock>
    </>
  );
}
