import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { API_ROOT } from "@/lib/api/config";

export const metadata: Metadata = {
  title: "Bring your own model",
  description:
    "Point LensAI at your own AI endpoint so your documents never reach ours. STRICT is the default and it means exactly what it says.",
};

export default function ByomPage() {
  return (
    <>
      <h1>Bring your own model</h1>
      <p>
        By default your documents are processed by LensAI&rsquo;s model. You can point us at{" "}
        <strong>your</strong> endpoint instead, so they never reach ours. This is a configuration
        change, not a deployment: register the endpoint, set your data policy, and every job for
        your account routes through it.
      </p>

      <h2>The data policy is the promise</h2>
      <table>
        <thead>
          <tr>
            <th>
              <code>data_policy</code>
            </th>
            <th>What happens when your provider is unavailable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>
                <code>STRICT</code>
              </strong>{" "}
              (default)
            </td>
            <td>
              Your jobs <strong>fail</strong>. Nothing is sent to our model.
            </td>
          </tr>
          <tr>
            <td>
              <code>ALLOW_PLATFORM_FALLBACK</code>
            </td>
            <td>We use ours so the job still completes.</td>
          </tr>
        </tbody>
      </table>

      <Callout tone="pass" title="STRICT is the default, deliberately">
        Falling back is the behaviour you opt <em>in</em> to, not the one you have to remember to
        switch off. If your endpoint went down and we quietly fell back, your jobs would succeed,
        every dashboard would stay green, and the one guarantee you bought would be broken with
        nothing recording it.
      </Callout>

      <p>
        Under STRICT a job whose provider is unusable fails with{" "}
        <code>no_provider_configured</code> — and no document is sent anywhere at all, because the
        provider is resolved <em>before</em> anything is fetched or read. Every completed
        verification records which provider produced it, so &ldquo;did anything of ours ever reach
        the platform model&rdquo; is answerable with a query rather than a log search.
      </p>

      <h2>Register an endpoint</h2>

      <CodeBlock language="bash">{`curl -X POST ${API_ROOT}/portal/ai-providers \\
  -H "Authorization: Bearer $PORTAL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "acme-azure-eu",
    "adapter": "azure_openai",
    "model": "gpt-4o-deployment",
    "api_key": "…",
    "config": {
      "endpoint": "https://acme-eu.openai.azure.com",
      "api_version": "2025-01-01-preview",
      "max_concurrency": 4
    }
  }'`}</CodeBlock>

      <p>
        We probe the endpoint immediately and return <code>health_ok</code> inline. A provider that
        fails is stored as <code>UNHEALTHY</code> rather than silently trusted — for a STRICT
        account an unreachable provider means failing jobs, and finding out at your next submission
        is too late.
      </p>

      <Callout tone="neutral" title="The API key is never returned">
        It goes into a secret store; the database holds only a pointer. A dump of it contains no
        usable credential — and the console will never show it back to you either.
      </Callout>

      <h2>Which adapter</h2>
      <table>
        <thead>
          <tr>
            <th>
              <code>adapter</code>
            </th>
            <th>For</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>azure_openai</code>
            </td>
            <td>
              An Azure OpenAI deployment. <code>config.endpoint</code> is your resource URL, and{" "}
              <code>model</code> is the <strong>deployment</strong> name, not the model name.
            </td>
          </tr>
          <tr>
            <td>
              <code>openai</code>
            </td>
            <td>OpenAI itself.</td>
          </tr>
          <tr>
            <td>
              <code>openai_compatible</code>
            </td>
            <td>
              Anything else speaking the OpenAI chat-completions API — vLLM, Ollama, LiteLLM,
              Together, Groq, your own gateway. Requires <code>config.base_url</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <p>Bedrock, Vertex and Anthropic are not available yet.</p>

      <h3>Declare what your model can do</h3>
      <p>
        For <code>openai_compatible</code> we cannot reliably ask your endpoint what it supports,
        and finding out during a job is the worst time. State it:
      </p>

      <CodeBlock language="json">{`"config": {
  "base_url": "http://vllm.internal:8000/v1",
  "vision": true,
  "native_json_schema": false,
  "max_images_per_request": 4,
  "context_tokens": 32000
}`}</CodeBlock>

      <p>
        Defaults are pessimistic — no vision, no strict JSON schema — so an under-specified provider
        degrades to something that works rather than failing with a 400.
      </p>

      <Callout tone="warn" title="A text-only model needs a document with a text layer">
        With <code>vision: false</code>, scanned documents cannot be processed at all: there is no
        OCR adapter yet, so those jobs fail with <code>provider_incompatible</code> rather than
        silently producing an empty extraction. Digital PDFs are fine.
      </Callout>

      <h3>Tuning</h3>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Why you would set it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>max_concurrency</code>
            </td>
            <td>
              A single-GPU endpoint tolerates far less than Azure at production quota. Default 8.
            </td>
          </tr>
          <tr>
            <td>
              <code>timeout_s</code>
            </td>
            <td>Read timeout. Should be at least 3× your observed p99.</td>
          </tr>
        </tbody>
      </table>

      <h2>Routing</h2>
      <p>The provider is resolved per job, taking the first that applies:</p>
      <CodeBlock language="text">{`job → template → client → your account default → LensAI platform`}</CodeBlock>
      <p>
        So you can run most clients on your own model and route one legacy client — or one document
        type — somewhere else. A template names a provider by its <code>name</code>, not its id, so
        a config stays readable and portable between environments.
      </p>

      <h2>Managing providers</h2>
      <CodeBlock language="text">{`GET  /portal/ai-providers                     your providers + current routing
POST /portal/ai-providers/{id}/health-check   re-probe; clears UNHEALTHY on recovery
POST /portal/ai-providers/{id}/set-default    route the account through it
POST /portal/ai-providers/{id}/disable        take it out of the routing chain
PUT  /portal/ai-providers/data-policy         STRICT or ALLOW_PLATFORM_FALLBACK`}</CodeBlock>

      <p>
        <code>disable</code> is not a delete. Completed verifications reference the provider that
        produced them, and removing the row would erase the answer to &ldquo;which model produced
        this verdict&rdquo; for every job it ever ran. All of this is on{" "}
        <Link href="/app/ai">AI providers</Link> in the console.
      </p>

      <h2>When something is wrong</h2>
      <table>
        <thead>
          <tr>
            <th>
              <code>code</code>
            </th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>no_provider_configured</code>
            </td>
            <td>
              STRICT, and none of your providers is usable.{" "}
              <strong>Nothing was sent anywhere.</strong> Fix the endpoint, then health-check it.
            </td>
          </tr>
          <tr>
            <td>
              <code>provider_auth_failed</code>
            </td>
            <td>
              Your credential was rejected, or none is stored. Not retried — re-save the provider
              with its key.
            </td>
          </tr>
          <tr>
            <td>
              <code>provider_incompatible</code>
            </td>
            <td>The template needs a capability your model does not declare, usually vision.</td>
          </tr>
          <tr>
            <td>
              <code>provider_unavailable</code>
            </td>
            <td>Your endpoint timed out or returned 5xx. Retried with backoff.</td>
          </tr>
        </tbody>
      </table>

      <p>
        A provider that fails repeatedly trips a circuit breaker scoped to that provider alone, so
        your outage never affects anyone else&rsquo;s jobs — and nobody else&rsquo;s affects yours.
      </p>
    </>
  );
}
