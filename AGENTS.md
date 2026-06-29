# CRM AI Development Rules

## Feature-Level Notes

Before working inside any folder, check for an `AGENTS.md` in that folder **and its parents**, and
follow it — these capture feature-specific context that isn't obvious from the code. Many
`src/app/(main)/dashboard/*` features have one; don't assume from this not listing them. If your
change makes one of those files wrong, update it in the same change; treat that as part of "done."

## Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## Design System Rules

- Do not create new visual styles unless explicitly asked.
- Use the existing UI components first without adding additional styles unless absolutely necessary, i.e., if the design system does not provide the component needed, layout, or style needed for a feature.
- Use existing form, button, dialog, input, card, table, badge, and toast components.
- Do not write custom CSS unless explicitly requested.
- Use Tailwind utility classes from the existing theme.
- Match the current spacing, border radius, shadows, dark mode colors, and typography.
- Do not modify global CSS, Tailwind config, or theme tokens unless explicitly requested.

## Technical Stack & Architecture Rules

### 1. Verification & Compile Checks

- Always execute `npx tsc --noEmit` inside the dashboard app directory to check for TypeScript errors before completing any code changes.
- Use Prettier for formatting with `npm run format`.
- Ensure all Biome lint checks pass cleanly using `npx biome check --write`; Biome formatting is disabled.
- When you touch logic with tests (`*.test.ts`), run the relevant suite with `npm run test:run` (Vitest). Firestore rules changes must pass `npm run test:rules`; portal/contract/server-action flows have their own specs alongside the code.

### 2. Next.js Client & Server Boundaries

- Declare `"use client"` strictly at the top of files that utilize browser events, local states, or Firebase Client Auth SDK listeners (e.g. `onAuthStateChanged`).
- Secure all critical third-party API keys (e.g., Gemini, Weather API) entirely inside Server Actions or API routes under `src/server/`. Never expose them to client-side bundles or public runtime scripts.
- To prevent stale Server Action weather/scraping cache states on reload, fetch real-time APIs with the `{ cache: "no-store" }` parameter explicitly configured.

### 3. State-Safe Modal Navigation

- When triggering creation dialogs or drawer components from global layouts (like the sidebar), use parameter-driven deep links (e.g., `/dashboard/library?add=true`) rather than cross-page state emitters.
- Always implement query parameter cleanup via `window.history.replaceState` immediately post-render to ensure URL hygiene and prevent repeat triggers on reload.

### 4. Forms & Validation

- Use React Hook Form (`react-hook-form`) with `Controller` for all form inputs.
- Use Zod (`zod`) for all form schema validation via `zodResolver`.
- Never use uncontrolled `useState` form state for new forms — always wire through RHF.
- For phone number fields, always use the shared helpers in `@/lib/utils` — never write a local phone formatter. Format the input `onChange` and all display with `formatPhone` (USA 10-digit `(XXX) XXX-XXXX`), build `tel:` links with `normalizePhone`, and validate in the Zod schema via `.refine(isValidUsPhone, "Enter a valid 10-digit US phone number.")`.

### 5. Data Writes & Server Actions

- Creating core entities (clients, projects, contracts) and any write that mints a reference code, needs a Firestore transaction, or must bypass client security rules goes through a `"use server"` action in `src/server/*-actions.ts` (e.g. `client-actions.ts`, `project-actions.ts`, `contract-actions.ts`) using the firebase-admin SDK — not the client `db.ts` helpers.
- Reference codes (`clientCode`, `projectCode`, contract codes) are minted server-side via `allocateReferenceCode` inside a transaction. Never generate them on the client.
- Server actions derive the org from the active-org cookie (`ACTIVE_ORG_COOKIE`), never from client-supplied input.
- Routine field updates that `firestore.rules` already permits (e.g. realtime layout/state writes) may still use the client `db.ts` helpers directly.
