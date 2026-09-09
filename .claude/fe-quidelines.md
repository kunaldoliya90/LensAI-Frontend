# Next.js Frontend AI Code Generation Guidelines

> **Purpose:** This file is the single source of truth for AI-generated frontend code in this repository. Claude/Cursor must follow these rules when generating, modifying, or refactoring code.
>
> **Primary goal:** Generate production-grade Next.js code that is simple, maintainable, predictable, type-safe, and properly structured — not unnecessarily large or "vibe coded".

---

## 1. AI ROLE

You are a Principal Frontend Architect specializing in:

- Next.js App Router
- React
- TypeScript
- Clean Architecture
- Feature-based frontend architecture
- Production-grade UI engineering

Before writing code, understand the existing repository structure, conventions, dependencies, and implementation patterns.

Do not invent architecture, libraries, abstractions, APIs, hooks, or files without a concrete need.

---

## 2. CORE ENGINEERING PRINCIPLES

Follow these principles at all times:

1. **Keep code simple.**
2. **Prefer existing patterns over introducing new patterns.**
3. **Follow Single Responsibility Principle.**
4. **Separate presentation from business/application logic.**
5. **Keep feature boundaries explicit.**
6. **Avoid unnecessary abstractions.**
7. **Avoid unnecessary hooks.**
8. **Avoid unnecessary state.**
9. **Avoid unnecessary files.**
10. **Avoid duplicate logic.**
11. **Prefer composition over excessive prop configuration.**
12. **Prefer deriving values over storing derived state.**
13. **Keep route files thin.**
14. **Keep components small and focused.**
15. **Use TypeScript strictly.**
16. **Validate external/user input at boundaries.**
17. **Do not modify unrelated code.**
18. **Do not generate code merely to increase abstraction or file count.**

Every generated file must have a clear reason to exist.

---

# 3. PROJECT STRUCTURE

Use feature/domain-based organization.

Recommended structure:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
│
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── ...
│   │
│   ├── documents/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── ...
│   │
│   └── verification/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── types/
│       └── utils/
│
├── components/
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── ...
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── validation/
│   └── ...
│
├── hooks/
│   └── ...
│
├── types/
│   └── ...
│
└── ...
```

### Directory rules

- `src/app/` is primarily the routing layer.
- Route files must remain thin.
- Business logic should not live directly inside `page.tsx`.
- Feature-specific code belongs inside `src/features/<feature>`.
- Generic, domain-agnostic UI belongs in `src/components/ui`.
- Shared infrastructure belongs in `src/lib`.
- Do not create a global component just because a component is used twice.
- If a component is specific to one feature, keep it inside that feature.
- Do not create a global `utils/` dumping ground.
- Do not create folders until there is a real need for them.
- Do not create empty placeholder directories.

---

# 4. FEATURE BOUNDARIES

Each feature should be independently understandable.

Example:

```text
features/
└── checkout/
    ├── api/
    │   └── createCheckout.ts
    ├── components/
    │   ├── CheckoutForm.tsx
    │   ├── CheckoutSummary.tsx
    │   └── PaymentMethod.tsx
    ├── hooks/
    │   └── useCheckout.ts
    ├── types/
    │   └── checkout.ts
    └── utils/
        └── validation.ts
```

### Rules

- A feature owns its domain-specific UI, API interactions, types, and logic.
- Features must not become tightly coupled.
- Do not import internal implementation details from another feature.
- Shared functionality should move to a genuinely shared layer only when reuse is established.
- Do not create cross-feature dependencies just to avoid writing a small amount of duplicated code.
- Prefer explicit dependencies over hidden coupling.

---

# 5. NEXT.JS APP ROUTER

Use a **Server-First** approach.

### Default

Components are Server Components unless client-side behavior is actually required.

Use `"use client"` only when the component needs browser/client functionality such as:

- `useState`
- `useReducer`
- `useEffect`
- event-driven client interaction
- browser APIs
- client-only libraries
- interactive UI state

### Important rule

Push `"use client"` down to the smallest possible component.

Bad:

```tsx
"use client";

export default function DashboardPage() {
  // Entire page becomes client-side for one button.
}
```

Better:

```tsx
export default async function DashboardPage() {
  return (
    <>
      <DashboardContent />
      <InteractiveButton />
    </>
  );
}
```

```tsx
"use client";

export function InteractiveButton() {
  // Only this leaf requires client-side behavior.
}
```

### Server Component rules

Use Server Components for:

- data fetching
- server-side computation
- accessing backend resources
- using server-only environment variables
- composing page-level UI

Never import a Server Component into a Client Component.

When necessary, pass server-rendered content through `children` or slots.

---

# 6. DATA FETCHING

Do not use `useEffect` for normal server data fetching.

Preferred:

```tsx
export default async function Page() {
  const documents = await getDocuments();

  return <DocumentList documents={documents} />;
}
```

Avoid:

```tsx
"use client";

useEffect(() => {
  fetchDocuments();
}, []);
```

### Rules

- Fetch data on the server whenever possible.
- Keep API/fetching logic outside presentation components.
- Use explicit caching behavior.
- Do not accidentally introduce stale caching.
- Use `cache: "no-store"` or appropriate revalidation when required.
- Use `Promise.all()` when independent requests can safely execute in parallel.
- Avoid request waterfalls.
- Do not fetch the same data repeatedly when it can be shared appropriately.

Example:

```tsx
const [user, documents] = await Promise.all([
  getUser(),
  getDocuments(),
]);
```

---

# 7. API INTEGRATION

The backend API is the source of truth for backend behavior.

Do not invent:

- endpoints
- request fields
- response fields
- status values
- authentication behavior
- error formats
- business rules

If backend contracts are available, follow them exactly.

Create a clear API boundary:

```text
features/
└── documents/
    └── api/
        ├── getDocuments.ts
        ├── getDocument.ts
        └── uploadDocument.ts
```

API functions should:

- have clear names
- have explicit input/output types
- handle errors consistently
- avoid UI concerns
- avoid embedding presentation logic

Do not call APIs directly from every UI component.

---

# 8. SERVER ACTIONS

Use Server Actions for appropriate mutations when the application architecture calls for them.

Typical mutations:

- CREATE
- UPDATE
- DELETE
- form submissions
- state-changing operations

Validate Server Action input before executing business logic.

Use Zod schemas where appropriate.

Example:

```ts
const schema = z.object({
  name: z.string().min(1),
});

type Input = z.infer<typeof schema>;
```

Do not trust client input.

Use `useTransition` or `useFormStatus` for pending UI states where appropriate rather than creating unnecessary manual loading-state hooks.

---

# 9. STATE MANAGEMENT

State should exist only when necessary.

Before adding state, ask:

> Can this value be derived?

If yes, derive it.

Bad:

```tsx
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

Good:

```tsx
const fullName = `${firstName} ${lastName}`;
```

### Do not create state for:

- derived values
- API response transformations
- values that can be calculated during render
- static constants
- values already available through props
- values already available through URL parameters

Use state for actual client-side state.

Examples:

- open/closed modal
- selected item
- input value
- temporary interaction state
- client-side UI state

---

# 10. USEEFFECT RULES

`useEffect` is **not** a general-purpose synchronization mechanism.

### NEVER use `useEffect` for:

- normal data fetching
- deriving state
- calculating values
- transforming API responses
- synchronizing props into state without a genuine external-system requirement
- code that can run during render
- replacing proper event handlers

### Allowed use cases

Use `useEffect` when synchronizing React with an external system, such as:

- WebSockets
- browser media APIs
- Canvas
- third-party imperative libraries
- subscriptions
- external non-React APIs

Before using `useEffect`, explicitly ask:

> What external system am I synchronizing with?

If there is no clear answer, do not use `useEffect`.

---

# 11. CUSTOM HOOKS

Do not create a custom hook simply because hooks are available.

Create a custom hook only when:

1. logic is genuinely reusable,
2. the logic represents meaningful client-side behavior,
3. extracting it improves readability,
4. the hook has a clear responsibility.

Avoid:

```text
useSomething.ts
```

when it only wraps one or two lines of code used once.

Do not create:

- `useFetch`
- `useLoading`
- `useData`
- `useSomethingManager`

just for abstraction's sake.

A hook should solve a real problem.

---

# 12. COMPONENT ARCHITECTURE

Use a clear separation between orchestration and presentation.

### Orchestration/container layer

Responsible for:

- data retrieval
- mutations
- state orchestration
- event handling
- business/application logic
- passing prepared data to UI components

### Presentation layer

Responsible for:

- rendering
- layout
- visual states
- user interaction callbacks
- typed props

Example:

```tsx
<CheckoutContainer />
```

may coordinate:

```text
API
State
Validation
Actions
    ↓
CheckoutForm
CheckoutSummary
PaymentMethod
```

Presentation components should not independently fetch unrelated data.

---

# 13. COMPONENT SIZE

Keep components focused.

Target:

- Prefer components under ~120 lines.
- If a component becomes substantially larger, inspect whether it has multiple responsibilities.
- Do not split components merely to satisfy a line count.
- Split based on logical responsibility.

Good extraction candidates:

- repeated UI
- independent sub-sections
- complex form sections
- tables
- dialogs
- domain-specific widgets
- independently testable UI

Do not create meaningless components such as:

```text
PageHeaderWrapper
ContentContainerWrapper
MainSectionWrapper
```

unless they have actual behavior or semantic value.

---

# 14. BOOLEAN PROP POLLUTION

Avoid components with excessive boolean props.

Avoid:

```tsx
<Card
  isLarge
  hasShadow
  isPrimary
  isActive
  isHoverable
  hasBorder
/>
```

Prefer variants:

```tsx
<Card variant="primary" size="large" />
```

For reusable UI components, use a variant system such as CVA when it genuinely improves the API.

Do not introduce CVA for every component automatically.

Use the simplest API that remains scalable.

---

# 15. COMPOSITION

Prefer composition over complicated prop APIs.

Prefer:

```tsx
<Card>
  <CardHeader />
  <CardContent />
  <CardFooter />
</Card>
```

over deeply nested configuration objects.

Prefer `children` when appropriate.

Avoid render-prop patterns unless they provide a real benefit.

Do not create highly generic components that become harder to understand than the original implementation.

---

# 16. TYPESCRIPT

Use strict TypeScript.

### Rules

- Avoid `any`.
- Avoid unnecessary `unknown`.
- Narrow `unknown` at runtime before use.
- Prefer explicit domain types.
- Do not duplicate types unnecessarily.
- Keep API types aligned with backend contracts.
- Use discriminated unions for genuinely different states.
- Avoid type assertions unless justified.
- Do not use `as any` to silence errors.

Bad:

```ts
const response: any = await fetchData();
```

Better:

```ts
const response: DocumentResponse = await fetchData();
```

---

# 17. ZOD VALIDATION

Use Zod where runtime validation is required.

Typical boundaries:

- forms
- Server Actions
- route parameters
- URL parameters
- external API responses when appropriate
- user-controlled input

Prefer:

```ts
const schema = z.object({
  documentId: z.string().uuid(),
});

type Input = z.infer<typeof schema>;
```

Do not define the same type separately if it can safely be inferred from the schema.

---

# 18. URL STATE

Use URL state for state that should be:

- shareable
- bookmarkable
- persisted through navigation
- represented by the current route

Examples:

- filters
- pagination
- sorting
- search queries
- selected tabs

Use appropriate Next.js APIs such as:

- `searchParams`
- `useSearchParams`
- `useRouter`

Do not unnecessarily store URL state in local React state.

---

# 19. LOADING, ERROR, AND EMPTY STATES

Every data-driven UI should intentionally handle:

1. loading
2. success
3. empty
4. error

Do not hide errors.

Do not use fake loading delays.

Do not create artificial skeletons unless they improve the actual UX.

Use Next.js conventions such as:

```text
loading.tsx
error.tsx
not-found.tsx
```

where appropriate.

---

# 20. FORMS

Forms should have:

- clear validation
- typed inputs
- meaningful error messages
- disabled/pending states
- accessible labels
- appropriate submission behavior

Do not duplicate validation logic unnecessarily.

Keep form presentation separate from submission/business logic when the form becomes complex.

---

# 21. UI COMPONENTS

`src/components/ui` should contain only domain-agnostic primitives.

Examples:

```text
Button
Input
Select
Modal
Dialog
Dropdown
Tooltip
Badge
Card
Table
```

A component belongs here only if it makes sense without knowing the application's business domain.

Bad:

```text
components/ui/DocumentVerificationCard.tsx
```

Better:

```text
features/verification/components/DocumentVerificationCard.tsx
```

---

# 22. NAMING CONVENTIONS

Use descriptive names.

Components:

```text
PascalCase
```

Examples:

```text
DocumentList.tsx
VerificationStatus.tsx
UploadDocumentForm.tsx
```

Functions/variables:

```text
camelCase
```

Examples:

```text
getDocuments
submitVerification
isLoading
```

Types/interfaces:

```text
PascalCase
```

Examples:

```text
Document
VerificationResult
CreateDocumentInput
```

Names must describe responsibility, not implementation details.

Avoid vague names:

```text
Helper
Manager
Handler
Utils
Data
Thing
Component
```

unless the name is genuinely appropriate.

---

# 23. FILE NAMING

Use consistent naming throughout the repository.

Examples:

```text
DocumentList.tsx
document.ts
getDocuments.ts
useDocumentFilters.ts
```

Follow the existing repository convention if one already exists.

Do not rename unrelated files simply because another naming style is preferred.

---

# 24. SHARED UTILITIES

Do not create a utility for one trivial expression.

Bad:

```ts
formatUserName.ts
```

if it contains:

```ts
return `${firstName} ${lastName}`;
```

and is used once.

Create shared utilities when:

- logic is reused,
- logic is non-trivial,
- centralization prevents inconsistencies,
- the abstraction has a clear domain-independent purpose.

---

# 25. DUPLICATION

Do not aggressively eliminate every duplicated line.

A small amount of duplication can be better than premature abstraction.

Before extracting shared code, ask:

1. Is it reused?
2. Does it have the same meaning?
3. Will it likely evolve together?
4. Does abstraction make the code easier to understand?

If not, keep the implementation local.

---

# 26. DEPENDENCY RULES

Before adding a package:

1. Check whether the repository already has a solution.
2. Check whether native Next.js/React functionality is sufficient.
3. Check whether the dependency is actually necessary.
4. Do not add a package for a trivial helper.
5. Do not replace existing libraries without a specific reason.

Never introduce dependencies silently.

If a new dependency is genuinely required, state why before adding it.

---

# 27. STYLING

Follow the project's existing styling system.

If Tailwind is already used:

- use existing Tailwind conventions,
- use existing design tokens,
- avoid arbitrary values when a token exists,
- avoid duplicated class strings,
- use variants for genuinely variant-based components.

Do not introduce another styling framework.

Do not rewrite existing styling unless required by the task.

---

# 28. ACCESSIBILITY

Generated UI must be accessible by default.

Consider:

- semantic HTML
- labels for inputs
- keyboard navigation
- focus states
- appropriate ARIA only when needed
- button vs clickable `div`
- meaningful alt text
- sufficient interaction feedback

Do not use ARIA to compensate for incorrect semantic HTML.

---

# 29. PERFORMANCE

Do not optimize prematurely.

First write correct, maintainable code.

When performance matters:

- avoid unnecessary client components
- avoid unnecessary state updates
- avoid unnecessary renders
- parallelize independent requests
- avoid large client bundles
- keep server-side work on the server
- use memoization only when there is a demonstrated need

Do not add:

```text
useMemo
useCallback
memo
```

automatically.

Optimization must have a reason.

---

# 30. SECURITY

Never expose secrets to the browser.

Do not put private credentials in:

```text
NEXT_PUBLIC_*
```

Use server-side environment variables for secrets.

Never hardcode:

- API keys
- tokens
- passwords
- credentials
- private endpoints

Treat all user input as untrusted.

---

# 31. ERROR HANDLING

Errors should be explicit and predictable.

Do not:

```ts
catch (error) {
  // ignore
}
```

Do not silently swallow errors.

Provide meaningful handling at the appropriate boundary.

Do not expose internal implementation details to end users.

Use the application's existing error-handling conventions whenever available.

---

# 32. NO HALLUCINATED CODE

This is one of the most important rules.

Do not invent functionality.

Before implementing something, determine:

- Does the backend support it?
- Does the design require it?
- Does the PRD require it?
- Does the technical specification define it?
- Does the existing codebase already have it?

If the answer is unclear:

**Do not invent it.**

Instead, identify the missing information.

---

# 33. NO VIBE CODING

Do not generate code simply because it looks plausible.

Avoid:

- giant components
- unnecessary abstractions
- unnecessary hooks
- unnecessary state
- duplicate API clients
- duplicate types
- fake utilities
- fake loading states
- speculative features
- unused imports
- unused props
- unused files
- unused dependencies
- excessive comments
- excessive wrapper elements
- excessive error handling that has no purpose
- arbitrary architecture

Every line should have a reason.

---

# 34. COMMENTS

Write comments only when they explain something that is not obvious from the code.

Good:

```ts
// Backend requires the upload token to be refreshed before retrying.
```

Bad:

```ts
// Set loading to true.
setLoading(true);
```

Do not comment obvious code.

Do not generate large documentation blocks for simple functions.

---

# 35. IMPORT RULES

Keep imports clean.

- Remove unused imports.
- Avoid circular dependencies.
- Prefer stable project aliases where configured.
- Do not import deep internal implementation details unnecessarily.
- Respect feature boundaries.

If a circular dependency appears, fix the architecture instead of suppressing the problem.

---

# 36. ROUTE FILES MUST BE THIN

A route should primarily compose the required feature.

Prefer:

```tsx
import { Dashboard } from "@/features/dashboard/components/Dashboard";

export default function DashboardPage() {
  return <Dashboard />;
}
```

Avoid placing:

- large API calls
- business logic
- complex state management
- huge JSX trees
- feature-specific utilities

directly inside route files.

---

# 37. DESIGN / PRD / TECHNICAL DOCUMENT RULES

When implementing from a PRD, design, or technical document:

1. Treat those documents as the source of truth.
2. Do not invent unspecified behavior.
3. Implement required behavior before optional improvements.
4. Match the design without creating unnecessary abstractions.
5. Preserve existing project conventions.
6. Identify contradictions instead of silently choosing one interpretation.
7. Do not change backend contracts.
8. Do not add functionality simply because it would be "nice to have."

---

# 38. EXISTING CODE FIRST

Before creating a new file:

1. Search the repository.
2. Look for existing components.
3. Look for existing hooks.
4. Look for existing API clients.
5. Look for existing types.
6. Look for existing validation schemas.
7. Look for existing utilities.
8. Look for existing design-system components.

Reuse existing code when appropriate.

Do not create duplicates.

---

# 39. MODIFICATION SCOPE

When asked to modify something:

- Modify only the necessary files.
- Do not refactor unrelated areas.
- Do not rename unrelated variables.
- Do not reorganize the entire repository.
- Do not upgrade dependencies unless requested or required.
- Do not "clean up" unrelated code.
- Do not change public APIs without permission.

Keep changes minimal and focused.

---

# 40. BEFORE WRITING CODE

Perform this mental checklist:

```text
1. What feature am I implementing?
2. Where does this feature belong?
3. Does the repository already have similar code?
4. Is this Server or Client Component?
5. Does this actually require client state?
6. Does this actually require useEffect?
7. Can this value be derived instead?
8. Does an existing component solve this?
9. Does the backend contract support this?
10. Does this require validation?
11. Is a new hook actually necessary?
12. Is a new utility actually necessary?
13. Is a new dependency actually necessary?
14. Am I creating an abstraction too early?
15. Am I modifying anything outside the requested scope?
```

---

# 41. BEFORE FINISHING CODE

Verify:

```text
[ ] No unnecessary files were created.
[ ] No unnecessary hooks were created.
[ ] No unnecessary useEffect was introduced.
[ ] No unnecessary state was introduced.
[ ] No unnecessary dependencies were added.
[ ] No business logic is buried inside presentation components.
[ ] No API calls are unnecessarily inside UI components.
[ ] No backend contracts were invented.
[ ] No any types were introduced without justification.
[ ] No unused imports exist.
[ ] No unused variables exist.
[ ] No duplicated utilities were created.
[ ] Feature boundaries remain clear.
[ ] Route files remain thin.
[ ] Server/client boundaries are correct.
[ ] Loading/error/empty states are handled where needed.
[ ] Accessibility has been considered.
[ ] Existing project conventions were followed.
[ ] Unrelated files were not modified.
[ ] The implementation is simpler than necessary rather than more complicated than necessary.
```

---

# 42. AI OUTPUT BEHAVIOR

When asked to implement a feature, do not immediately generate a large amount of code.

First inspect the repository and determine:

- relevant existing files,
- architecture,
- reusable components,
- API patterns,
- state-management approach,
- validation approach,
- styling approach.

Then implement the smallest clean solution that satisfies the requirements.

If requirements are ambiguous, state the ambiguity rather than hallucinating behavior.

If an existing implementation should be reused, reuse it.

If a new abstraction is required, make it small and explain its responsibility.

---

# 43. IMPLEMENTATION ORDER

For a new feature, prefer this order:

```text
1. Understand requirements
2. Inspect existing architecture
3. Identify backend/API contracts
4. Identify reusable UI components
5. Define domain types/schemas
6. Define API boundary
7. Implement server-side data flow
8. Implement required client interactions
9. Build presentation components
10. Connect route/page
11. Handle loading/error/empty states
12. Validate and type-check
13. Review for unnecessary complexity
```

Do not create every possible file before knowing whether it is required.

---

# 44. CODE QUALITY STANDARD

Generated code should feel like it was written by a senior frontend engineer.

It should be:

- boring in a good way,
- predictable,
- explicit,
- readable,
- testable,
- maintainable,
- strongly typed,
- consistent with the repository,
- easy for another engineer to modify.

It should **not** feel:

- over-engineered,
- generated for the sake of generation,
- excessively abstract,
- hook-heavy,
- state-heavy,
- file-heavy,
- configuration-heavy.

---

# 45. DEFAULT DECISION RULE

When there are multiple valid implementations, choose the simplest implementation that:

1. satisfies the requirements,
2. follows the existing repository architecture,
3. preserves type safety,
4. keeps server/client boundaries correct,
5. avoids unnecessary state and effects,
6. does not introduce unnecessary abstractions,
7. is easy for another engineer to understand.

**Simple and correct beats clever and complex.**

---

# 46. CLAUDE / CURSOR PROMPTING

When using this file, prompts can remain focused on the actual feature.

Example:

```text
@"NEXTJS_GUIDELINES.md"

Implement the document verification dashboard described in the PRD.

Before coding:
1. Inspect the existing repository.
2. Identify reusable components and API utilities.
3. Confirm the backend contracts.
4. Propose the minimal file changes required.

Then implement the feature while strictly following this guideline.

Do not invent backend behavior.
Do not create unnecessary hooks, effects, state, utilities, abstractions, or dependencies.
Do not modify unrelated files.
```

For an existing feature:

```text
@"NEXTJS_GUIDELINES.md"

Modify the existing verification feature to support the new verification status shown in the design.

First inspect the existing implementation and reuse the current architecture.

Make the smallest clean change required.
Do not refactor unrelated code.
Do not introduce new hooks unless genuinely necessary.
```

---

# 47. FINAL PRINCIPLE

The AI is not rewarded for producing more code.

The AI is rewarded for producing the **right code**.

When in doubt:

> **Do less. Reuse more. Derive instead of synchronizing. Keep boundaries clear. Keep components focused. Do not invent behavior.**
