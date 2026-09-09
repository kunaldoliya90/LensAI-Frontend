# LensAI frontend

The public site, tenant console and LensAI staff admin for the LensAI document
verification API — one Next.js application, one design system, role-gated routes.

## Running it

```bash
npm install
cp .env.example .env.local     # point it at your API
npm run dev                    # http://localhost:3000
```

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_PREFIX=/api/v1
```

Every browser call goes to `{BASE}{PREFIX}/…`, except the health probes, which
sit on the origin at `/health/live` and `/health/ready`. Both variables are
public by design — there is no server-side secret in this app, and nothing here
proxies the API.

Calls are made from the browser, so **the API has to allow this origin**. Its
`cors_origins` setting already lists `http://localhost:3000`, which is why the
dev server runs there; any other port or a deployed hostname has to be added on
the API side or every request fails at the preflight.

| Script | |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## What is here

| Area | Routes |
|---|---|
| Marketing | `/`, `/about` |
| Documentation | `/docs` and ten sub-pages |
| Session | `/signup`, `/login`, `/suspended` |
| Tenant console | `/app` and twelve sub-pages |
| Staff admin | `/staff`, `/staff/keys`, `/staff/tenants`, `/staff/usage` |

Marketing and documentation are static Server Components. The console is
client-rendered — see *Authentication* below for why it has to be.

## Structure

```
src/
├── app/                     routing only; route files compose a feature
│   ├── (marketing)/         landing, about, docs
│   ├── (auth)/              login, signup
│   └── (console)/           /app/* and /staff/* behind one shell
├── features/<feature>/
│   ├── api/                 typed calls for that feature
│   └── components/          container + presentation for that feature
├── components/
│   ├── ui/                  domain-agnostic primitives
│   └── *.tsx                shared domain components (StatusPill, ErrorNotice…)
├── hooks/                   useUrlParams
└── lib/
    ├── api/                 client, types, error envelope, QueryProvider
    ├── auth/                browser-held credentials
    ├── cn.ts  format.ts  json.ts
```

## Two credentials, never mixed

The API has two authentication mechanisms on two prefixes, and this frontend
keeps them apart the same way the backend does.

| Surface | Header | Where it is used here |
|---|---|---|
| Portal and admin | `Authorization: Bearer …` | Everything in the console except the playground |
| Verification API | `x-api-key: …` | Only `/app/playground` |

`apiRequest` takes the credential as a discriminated union, so a call cannot
carry both and an `apikey` call cannot omit the key.

**There is no JWT route that lists or reads verifications.** That is a backend
gap, not an omission here. The console therefore treats *Usage* and
*Deliveries* as the operational views that always work after login, and the
playground asks for an API key the user pastes. No jobs table is faked from a
portal token.

## Authentication

The API sets no cookies, issues no refresh token, and has no password reset. A
session lives in `sessionStorage` under `lensai.session`; the playground key
lives under `lensai.playgroundApiKey`. Both are read through
`useSyncExternalStore` so the non-React API client can read them too, and both
are cleared on logout.

Because the token is not a cookie, middleware cannot see it: route protection is
`RequireSession` / `RequireAdmin` on the client, and the console is not
server-rendered with data. The API remains the real boundary — it re-reads the
user's role from the database on every request, so a demoted admin gets
`403 not_authorized` on their next call no matter what the UI shows.

The session store signs the user out 60 seconds before `expires_in` elapses, so
no in-flight call races the expiry.

## Conventions worth knowing

- **Secrets shown once.** `SecretOnceModal` is the single presentation for an
  API key or a webhook signing secret: copy, download, a blocking
  acknowledgement, and no way to dismiss around it.
- **Errors are never generic.** `ErrorNotice` renders the API envelope —
  `message` as the primary text, then `code` and `correlation_id` in mono, plus
  field-level problems from `details.errors`.
- **Filters live in the URL** (`useUrlParams`), so a filtered view is
  shareable and survives a reload.
- **Polling, not sockets.** The playground polls `GET /verifications/{id}` every
  two seconds while a job is QUEUED or PROCESSING, and stops on a terminal
  status.
- **Status vocabulary is centralised** in `components/StatusPill.tsx`, so
  ACTIVE, PENDING and FAILED cannot mean different colours on different pages.

## Deliberate omissions

These are absent because the API has no endpoint for them, not because they were
overlooked: password reset, email verification, SSO, 2FA, refresh tokens,
inviting a second user, editing or deleting a client, editing a template in
place, retrieving a secret after it was issued, and previewing document bytes.
