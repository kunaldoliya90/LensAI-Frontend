import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { API_ROOT } from "@/lib/api/config";

export const metadata: Metadata = {
  title: "Authentication",
  description:
    "Two credentials with no path between them: x-api-key for the verification API, a session token for the portal and admin surfaces.",
};

export default function AuthenticationPage() {
  return (
    <>
      <h1>Authentication</h1>
      <p>
        LensAI has two credentials, on two prefixes, resolving to two different context types. A
        credential for one can never satisfy the other — that separation is deliberate, and it is
        enforced in the API rather than by convention.
      </p>

      <table>
        <thead>
          <tr>
            <th>Surface</th>
            <th>Header</th>
            <th>Used for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Verification API</td>
            <td>
              <code>x-api-key: {"{plaintext_key}"}</code>
            </td>
            <td>
              <code>/verifications*</code>, <code>/documents*</code>, <code>/templates</code>,{" "}
              <code>/portal/whoami</code>
            </td>
          </tr>
          <tr>
            <td>Portal and admin</td>
            <td>
              <code>Authorization: Bearer {"{access_token}"}</code>
            </td>
            <td>
              Every other <code>/portal/*</code> route and all of <code>/admin/*</code>
            </td>
          </tr>
        </tbody>
      </table>

      <Callout tone="warn" title="Never send both on one request">
        A machine caller uses the API key. A human session uses the bearer token. There is no route
        that accepts either.
      </Callout>

      <h2>API keys</h2>
      <p>
        A key is requested from the console and is issued <code>PENDING</code>. It authenticates
        only after a LensAI administrator approves it and assigns a rate-limit tier. The plaintext
        is returned exactly once, at creation; LensAI keeps a peppered hash and a display prefix,
        so nobody — including support — can read it back.
      </p>

      <p>Each key carries an environment and a tier:</p>

      <table>
        <thead>
          <tr>
            <th>Tier</th>
            <th>Requests / minute, per key</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sandbox</code>
            </td>
            <td>60</td>
          </tr>
          <tr>
            <td>
              <code>standard</code>
            </td>
            <td>600</td>
          </tr>
          <tr>
            <td>
              <code>high</code>
            </td>
            <td>3000</td>
          </tr>
          <tr>
            <td>
              <code>unlimited</code>
            </td>
            <td>No limit applied</td>
          </tr>
        </tbody>
      </table>

      <p>
        The limit is per key, not per tenant, so one runaway integration cannot starve your other
        keys. Exceeding it returns <code>429 rate_limited</code> with a <code>Retry-After</code>{" "}
        header — honour it rather than retrying immediately.
      </p>

      <h3>Confirm a key with whoami</h3>
      <p>
        The one <code>/portal/</code> route that takes an API key. It exists so an integrator can
        verify a key resolves to the tenant and environment they expect.
      </p>

      <CodeBlock language="bash">{`curl ${API_ROOT}/portal/whoami \\
  -H "x-api-key: $LENSAI_API_KEY"`}</CodeBlock>

      <h3>Failure modes are distinct on purpose</h3>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>
              <code>code</code>
            </th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>401</td>
            <td>
              <code>missing_api_key</code>
            </td>
            <td>No header was sent.</td>
          </tr>
          <tr>
            <td>401</td>
            <td>
              <code>invalid_api_key</code>
            </td>
            <td>The key is not recognised.</td>
          </tr>
          <tr>
            <td>403</td>
            <td>
              <code>api_key_pending_approval</code>
            </td>
            <td>Real key, not yet approved. Wait; do not re-issue.</td>
          </tr>
          <tr>
            <td>403</td>
            <td>
              <code>api_key_revoked</code>
            </td>
            <td>Terminal. Issue a new key.</td>
          </tr>
          <tr>
            <td>403</td>
            <td>
              <code>api_key_expired</code>
            </td>
            <td>Past its <code>expires_at</code>.</td>
          </tr>
          <tr>
            <td>403</td>
            <td>
              <code>tenant_suspended</code>
            </td>
            <td>Account-level block. Every key for the tenant fails the same way.</td>
          </tr>
        </tbody>
      </table>

      <p>
        &ldquo;Pending&rdquo; and &ldquo;invalid&rdquo; are separate codes because collapsing them
        turns every onboarding into a support ticket.
      </p>

      <h2>Portal sessions</h2>
      <p>
        <code>POST /portal/signup</code> and <code>POST /portal/login</code> return a session:
      </p>

      <CodeBlock language="json">{`{
  "access_token": "eyJhbGciOi…",
  "token_type": "bearer",
  "expires_in": 3600,
  "tenant_id": "…",
  "user_id": "…",
  "email": "ops@acme.example.com",
  "role": "USER"
}`}</CodeBlock>

      <Callout tone="neutral" title="No refresh token, no password reset">
        The token is valid for <code>expires_in</code> seconds and there is no refresh endpoint, no
        password reset and no SSO. When it expires you sign in again. This console signs you out
        sixty seconds early so no in-flight call races the expiry.
      </Callout>

      <p>
        <code>role</code> is re-read from the database on every request, so a demotion from{" "}
        <code>ADMIN</code> takes effect on the next call rather than at the next login. Admin routes
        reject a session whose role is no longer <code>ADMIN</code> with{" "}
        <code>403 not_authorized</code>.
      </p>

      <h2>What the console stores in your browser</h2>
      <ul>
        <li>
          <code>lensai.session</code> — the portal token, in <code>sessionStorage</code>. The API
          sets no cookies.
        </li>
        <li>
          <code>lensai.playgroundApiKey</code> — the key you paste into the{" "}
          <Link href="/app/playground">Playground</Link>, also in <code>sessionStorage</code>. It is
          never written to a LensAI database and never leaves the browser except as the{" "}
          <code>x-api-key</code> header on the calls you trigger.
        </li>
      </ul>
      <p>Both are cleared when you log out, and when the browser tab closes.</p>
    </>
  );
}
