# Working in this repository

`.claude/fe-quidelines.md` is the standing rule set and takes precedence over
anything here. `.claude/project-lens-fe.md` is the product specification. This
file records only the decisions already made in this codebase, so a later change
matches what is here instead of inventing a second way to do the same thing.

## Backend contract

The LensAI backend lives at `../LensAI-Backend`. It is the source of truth for
shapes: `app/api/v1/endpoints/*.py` and `app/api/v1/schemas/*.py`. Do not invent
routes, fields or status values — read them there, or from `/docs` on the
running API.

Wire types are mirrored once, in `src/lib/api/types.ts`. Decimal fields
(`confidence`, `confidence_score`) arrive as **strings**.

## Where code goes

- `src/app/**` is routing only. A route file imports one feature component and
  renders it. Anything with `useSearchParams` beneath it needs a `<Suspense>`
  in the route file, or the build fails on prerender.
- `src/features/<feature>/api/<resource>.ts` holds that feature's calls —
  grouped per resource, not one file per function.
- A feature may import another feature's `api/` module or its exported
  component (`ClientSelect` is the example). Nothing reaches into another
  feature's internals.
- `src/components/ui` is domain-agnostic only. Domain-aware shared components
  (`StatusPill`, `ErrorNotice`, `SecretOnceModal`, `VerdictLegend`) sit directly
  in `src/components`.

## Patterns already chosen

- **Data fetching** is TanStack Query, called inline in container components.
  There are no `useX` wrapper hooks around `useQuery`.
- **State** is derived wherever it can be. The template and reference-data
  editors hold a nullable `draft` and fall back to the fetched value —
  `draft ?? fromQuery` — rather than syncing one into the other with an effect.
- **`useEffect` is used in exactly three places**, all guards
  (`RequireSession`, `RequireAdmin`, `RedirectIfAuthenticated`), and all of them
  read `sessionStore.get()` directly rather than the hook value, because on the
  first client render the hook still holds its server snapshot.
- **Forms**: React Hook Form + Zod where a form has real validation
  (signup, login, create-client, create-key); plain `useState` where it is a
  handful of fields feeding one mutation. Do not convert one to the other
  without a reason.
- **Feedback** is an inline `<Callout>` driven by mutation state. There is no
  toast system, and adding one would need a reason.
- **The console's look is a token swap, not a component set.** The
  `[data-theme="neon"]` and `[data-theme="porcelain"]` blocks in `globals.css`
  re-value the same semantic tokens the components already paint with, so a new
  console surface needs no per-ground variant — get the tokens right and both
  grounds follow. Neon is the loud dark ground — violet glass over a near-black
  page, distinct from the navy in `@theme`, which is the marketing palette;
  Porcelain is warm paper. Both are set in Geist. Marketing and auth sit outside
  that wrapper and are untouched by it.
- **The ground also owns a display figure's face.** `.figure` sets the SANS
  family, not the mono one, and no caller may add `font-mono` beside it — a
  utility wins over the class. Geist Mono draws a slashed zero as its *default*
  glyph, which was measured rather than assumed: `normal`, `"zero" 0`,
  `"ss01" 0`, `ss02`, `ss03` and `cv01` all leave the slash. At 9px in an id it
  is a useful 0-versus-O disambiguation; at 32px as a card's one figure it reads
  as an error glyph, and a dashboard of zeros looked like four failures.
- **Five console treatments belong to the ground, not to a component**, because
  no Tailwind colour token can express them: `--figure-size` and
  `--figure-image` behind `.figure` / `.figure-gradient`, `--nav-active-mark`
  behind the rail's current row, `--bar-image` behind a chart bar, and
  `--btn-image` / `--btn-glow` behind `.btn-primary`. Each has a neutral default
  on `:root` that Porcelain inherits and Neon replaces. A component asks for the
  treatment; it never names the colour. Add to that list rather than writing a
  second ground's value into a `className`.
- **Neon's values are the design's except where contrast forced a change**, and
  each of those changes is noted at the token that made it — `ink-subtle`,
  `fail` and the primary button's gradient. They are measured against the panel
  at its brightest, high on the right under the violet field, rather than
  against the page: that is where a panel has the least to give its own text.
- **The ground is the user's choice and it persists.** `consoleTheme.ts` holds it
  in `localStorage` behind an external store; `ConsoleShell` reads it with
  `useSyncExternalStore` and puts it on `data-theme`, and the switch lives in the
  sidebar footer. There is no flash to guard against because the shell renders
  nothing until the session store has been read, which is already post-hydration.
  `accent-bright` and `pass` / `warn` / `fail` are **inverted** between the two
  grounds rather than scaled — on dark they are brighter than the text around
  them, on paper they must be darker.
- **`.panel` is the console's only card.** Border, the ground's radius,
  `--panel-base`, the translucent gradient and the elevation travel together,
  and it cannot be a Tailwind colour token — so it is a class, not a utility
  string. `--panel-base` is load-bearing rather than decorative: `--panel` is
  only ~12% white, so without a base a panel was almost entirely whatever
  `--console-bg` sat behind it, and Neon's ground runs from `#2a1a52` to
  `#06050e` — two identical panels on one page came out visibly different
  colours and the topmost one read as highlighted. The base makes a panel
  mostly itself and only tinted by the page. Do not
  reintroduce `rounded-lg border border-line bg-ground shadow-*` as a card.
  `.panel-warn` is the amber variant, for a card whose whole job is to say a
  human has to look at this.
- **Micro-labels are mono, uppercase, 9.5–10px, letter-spaced.** Stat labels,
  table headers and the sidebar group headings all use that treatment; panel
  headings are 12.5px medium. The figure is the thing being read, not its label.
- **The playground's run stage is driven by the trace, never by a clock.** The
  worker commits a step row as each pipeline stage finishes, so the stage after
  the last one in `GET /verifications/{id}/steps` is the one running now —
  that inference, and every count on the stage, lives in
  `features/playground/runPhases.ts` as a pure function of the two responses.
  Motion splits by what it may claim: looping CSS (`.stage-sweep`, `.stage-halo`)
  says "working" and must never imply a position inside a stage, because nothing
  reports one; one-shot classes (`.rise`, `.land`, `.stamp`) fire on a real
  event — a step arriving, the job settling. Do not add a percentage bar.
- **The result board has one order, and it is the order the questions get
  asked in.** Verdict hero, then anything that changes how the verdict should
  be read, then the row-level verdicts as one table, then the pipeline, then
  the raw extraction and the plugin trace folded away in `<details>`. That
  sequence is the deliverable, recorded as numbered comments in
  `VerificationResultPanel`; do not reorder it, and do not put anything
  between the hero and the callouts under it.
  - The hero carries only three kinds of thing: the verdict, the arithmetic
    behind it, and the identity of the job. Every count on it comes from
    `resultSummary.ts`, which the table reads too — so the headline and the
    rows cannot disagree about how many matched.
  - An earlier version of this screen was a three-column Document / Checks /
    Evidence grid where a row had to be clicked before most of a check
    appeared. A verdict is read by scanning the disagreements, so the whole of
    a check now lives in the table row — expected, extracted, result,
    confidence, severity, plugin, remark — and non-matching rows carry a
    coloured left stripe so they are findable by shape and not only by colour.
  - The verdict `.land`s because the answer arriving is an event; nothing below
    it has an entrance, because a screen to be read should not move while you
    read it. Adding `.land` to an already-mounted element is what runs it, so
    no remount is needed.
- **The pipeline is drawn twice because it answers two questions.** Equal nodes
  left to right answer "what ran, in what order, and did anything break" — a
  path, so the nodes are not sized by duration. One stacked bar underneath
  answers "where did the time go" — a proportion, which a row of figures reads
  badly. Segments take `--bar-image`, never a colour per stage: position
  already carries the order, and the stage names sit under the bar rather than
  inside it because Porcelain's chart fill will not carry a label.
- **The playground is a flow, not a page of panels.** Submitting closes the
  setup panels — key, client, upload, submit — because the job is now the
  screen; a primary "Verify another document" on the finished verdict reopens
  them. Both are derived from the `verification` search param, so a link to a
  job opens in the same shape. While a job is running the page is the run stage
  and nothing else: the verdict banner, the archive and the setup are all
  absent, and the one live action (Cancel, while QUEUED) sits on the stage where
  the design puts its own text button.
- **Secondary sections are native `<details>`.** The verification archive and
  the pipeline trace both fold away behind a chevron, closed by default, with
  the header rule appearing only when open (`group-open:border-b`). No toggle
  state unless the disclosure gates a query, as the trace's does.
- **Nothing below the verdict renders while the job runs.** An empty `checks`
  array is a job still working, not a document with no checks — the run stage is
  the honest view of that moment.
- **Modals** are the native `<dialog>` element via `components/ui/Modal.tsx`,
  which is where the focus trap and ESC handling come from. `dismissible={false}`
  is for the secret-once flow.

## Things that will look wrong but are not

- The console is client-rendered. The API sets no cookie, so a Server Component
  cannot read the session and middleware cannot gate the routes. This is the one
  place the server-first default does not apply.
- `/app/playground` is the only page that sends `x-api-key`. Everything else
  sends the bearer token. Never mix them on one request.
- There is no verifications list anywhere outside the playground, because no
  portal route exposes one.
- Clients and templates have no delete, and templates have no in-place edit.
  Both are backend rules, not missing UI.

## Before finishing

```bash
npm run build    # includes the type-check
npx eslint .
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
