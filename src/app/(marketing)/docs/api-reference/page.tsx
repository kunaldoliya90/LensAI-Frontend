import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { API_ROUTES, HEALTH_ROUTES, type ApiRoute } from "@/features/docs/apiRoutes";
import { API_DOCS_URL, API_ROOT } from "@/lib/api/config";

function RouteTable({ routes }: { routes: ApiRoute[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Route</th>
          <th>Credential</th>
          <th>Returns</th>
        </tr>
      </thead>
      <tbody>
        {routes.map((route) => (
          <tr key={`${route.method} ${route.path}`}>
            <td>
              <code>
                {route.method} {route.path}
              </code>
              <span className="mt-1 block text-ink-muted">{route.summary}</span>
            </td>
            <td>
              <code>{route.credential}</code>
            </td>
            <td>
              <code>{route.returns}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const metadata: Metadata = {
  title: "API reference",
  description: "Every LensAI route, the credential it takes, and what it returns.",
};

export default function ApiReferencePage() {
  return (
    <>
      <h1>API reference</h1>
      <p>
        Every route, grouped by what it is for. Paths below are relative to{" "}
        <code>{API_ROOT}</code> unless stated otherwise.
      </p>

      <Callout tone="info" title="OpenAPI is the authority on shapes">
        This page lists what exists and which credential it takes. For exact request and response
        models, generated from the running service, use{" "}
        <a href={API_DOCS_URL} rel="noreferrer noopener" target="_blank">
          the interactive API browser
        </a>
        .
      </Callout>

      <h2>Credentials at a glance</h2>
      <table>
        <thead>
          <tr>
            <th>Marker</th>
            <th>Header</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>x-api-key</code>
            </td>
            <td>
              <code>x-api-key: {"{plaintext_key}"}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>Bearer</code>
            </td>
            <td>
              <code>Authorization: Bearer {"{access_token}"}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>Bearer + ADMIN</code>
            </td>
            <td>The same token, from a user whose role is ADMIN.</td>
          </tr>
          <tr>
            <td>
              <code>none</code>
            </td>
            <td>Unauthenticated.</td>
          </tr>
        </tbody>
      </table>

      {API_ROUTES.map((group) => (
        <section key={group.heading}>
          <h2>{group.heading}</h2>
          {group.note ? <p>{group.note}</p> : null}
          <RouteTable routes={group.routes} />
        </section>
      ))}

      <h2>Health</h2>
      <p>
        These sit on the API origin, outside the <code>/api/v1</code> prefix.
      </p>
      <RouteTable routes={HEALTH_ROUTES} />

      <h2>Conventions</h2>
      <ul>
        <li>
          <strong>Content type.</strong> <code>application/json</code> everywhere. Documents are
          never uploaded as bytes — every request body is JSON, including a submitted document,
          which is a URL.
        </li>
        <li>
          <strong>Pagination.</strong> <code>next_cursor</code> is opaque. Pass it back verbatim as{" "}
          <code>cursor</code>; do not parse it.
        </li>
        <li>
          <strong>Dates.</strong> ISO-8601 in bodies. Usage filters take date-only{" "}
          <code>YYYY-MM-DD</code> in <code>from</code> and <code>to</code>.
        </li>
        <li>
          <strong>Idempotency.</strong> <code>Idempotency-Key</code> is honoured on{" "}
          <code>POST /verifications</code>.
        </li>
        <li>
          <strong>Correlation.</strong> Send <code>X-Correlation-ID</code> and it is echoed through
          the logs; every error response carries one back.
        </li>
        <li>
          <strong>204 responses</strong> have no body: set-default, disable, data-policy and
          document delete.
        </li>
      </ul>

      <CodeBlock language="bash">{`# Two credentials, never on the same request.
curl ${API_ROOT}/verifications      -H "x-api-key: $LENSAI_API_KEY"
curl ${API_ROOT}/portal/clients     -H "Authorization: Bearer $PORTAL_TOKEN"`}</CodeBlock>
    </>
  );
}
