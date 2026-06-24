# Contracts Feature — Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Contracts-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Contracts code (this folder, the `Contract*` types in `src/lib/types.ts`, or
the contract helpers in `src/lib/db.ts`), update this file in the same change.** If a fact here is
now wrong, correct it; if you add/remove a token, field, status, or persistence step, reflect it. A
stale AGENTS.md is worse than none — treat updating it as part of "done."

## What this feature is (and is NOT)

A single-page contract **builder** that fills a fixed, code-based legal template with CRM data and
persists the result. It is intentionally minimal. **Do not add** (all explicitly out of scope):
PDF-export libraries, e-signature, the client portal, email sending, payment logic, in-app template
editing, or a version-history UI. "Print / PDF" is just the browser print dialog.

Routes: `contracts/page.tsx` is the list (reads real `getContracts`, rows link to the editor);
`new/page.tsx` renders `<ContractBuilder />` (create); `[contractId]/page.tsx` fetches one contract
(`getContract`, with an org-match tenant guard) and renders `<ContractBuilder contract={…} key={id}/>`
to edit it. `ContractBuilder` takes an optional `contract` prop — when present it seeds `values`,
`scopeItems`, `selectedProjectId`, `contractId`, and `status` from it (the `key` forces a remount so
those `useState` initializers re-run per contract). Opening a non-draft contract shows it locked
(saves and project changes disabled); there's still no dedicated read-only viewer that renders from
`lockedSnapshot`.
Active-page inputs under "Fields to Populate" show `FIELD_DEFS.explainer` below each input; pinned
global fields do not.

## The template is code, not data

The "document" lives in [contract-template.ts](./_components/contract-template.ts), not Firestore.
Keep it that way for now.

- `TEMPLATE_PAGES` — array of `{ page, heading, body }`. `body` holds `{{TOKEN}}` markers and
  `**bold**` runs. `heading` is internal (nav/debug), **not rendered**.
- `FIELD_DEFS` — the field manifest that drives everything: each token's `label`, `type`
  (`text|date|currency|textarea|client|auto|list`), `scope` (`global|page`), `source`
  (`user|client|company|project`), optional `page`, `explainer`, and `optional` (skipped by the send
  guard).
- Rendering: `SEGMENT_SPLIT_RE` splits a line into tokens / bold / plain. `DocumentBody` renders
  **line-by-line** as `<p>` so `isHeadingLine` (a single all-caps bold-only line) can center
  article/section headers. Don't collapse this back into one block — centering depends on it.
- Token emphasis is handled by the renderer (filled = `font-black`, empty = a hidden-in-print
  placeholder chip). **Never wrap a `{{TOKEN}}` in `**…**`** — bold can't nest a token.
- `CONTRACT_TEMPLATE_KEY` / `CONTRACT_TEMPLATE_VERSION` live here. **Bump the version** when a
  template/manifest change alters rendered output, so old `lockedSnapshot`s stay distinguishable.

## Where the data comes from (all reads, one exception)

- **Project + client** are read from the CRM: pick a project (`getProjects`), its `clientId`
  fetches the `Client` (`getClient`). `PROJECT_ADDRESS` and `CLIENT_*` are `auto`/project-derived —
  there is **no inline client creation** here; clients are added in the CRM.
- Draft contracts may change project. Saved drafts require a confirmation dialog first because the
  preview's client, project address, and project name will update while manual values and scope
  items stay put. Non-draft contracts must keep the project selector read-only, and project changes
  must never touch `lockedSnapshot`.
- **Firm identity + dark logo** come from `getOrganization(orgId).companyProfile` / `.branding`.
- `resolved` (a `useMemo`) composes every token's display string from values + project + client +
  company. Currency tokens (`CURRENCY_TOKENS`) format via `formatCurrency`; the `CurrencyField`
  input shows grouped digits via `formatCurrencyInput` with a focus bridge but **stores the raw
  number string**. Date renders via `formatPlainDate`.

## Print is CSS isolation, not a separate route

`@media print` in `src/app/globals.css` uses a `:has(.contract-print-area)` selector to `display:
none` all non-document chrome while leaving the document in **normal block flow** so it paginates
naturally. **Do not reintroduce `position: absolute`** on the print area — that was the root cause of
blank pages / overlap. `@page { size: A4; margin: 18mm }`. `.contract-print-area` also re-declares
the **light** theme tokens so the on-screen document is always "paper" regardless of app dark mode
(that's why the dark logo needs no `invert`). Page numbers and placeholder chips are
`display: none` in print.

## Persistence model — read this before touching db.ts

Flat top-level `contracts/{contractId}`, org-scoped (every doc carries `organizationId`; every query
filters by it). Two payload shapes built in
[build-contract-payload.ts](./_components/build-contract-payload.ts):

- **Draft = lightweight.** Persist only the editable inputs (`values`, `scopeItems`) plus
  list-friendly denorms (`title`, `clientName`, `projectName`, status, audit).
  `resolved`/`pages`/`parties`/`projectSnapshot` are **regenerated** from template + project/client/
  org — never stored at the top level. This keeps the future contracts-list read cheap (the client
  SDK fetches whole docs; don't bloat them with the ~9-page body).
- **`lockedSnapshot` = the frozen document.** Built only on **Send**. Holds `resolved` + `pages`
  (raw template bodies, tokens unsubstituted) so the contract renders identically even if
  `contract-template.ts` changes later. **The future client portal must read `lockedSnapshot`, never
  the live draft fields.**

Hard rules that bit us / are easy to break:

- **Numeric `Date.now()` timestamps everywhere — never `serverTimestamp()`/`Timestamp`.** The whole
  app uses epoch-ms numbers, and `cleanUndefined()` (`JSON.parse(JSON.stringify(...))`, used by
  every writer) would silently destroy a Firestore `FieldValue` sentinel. This applies to nested
  fields too (`lockedSnapshot.lockedAt`).
- **Single-write create.** `addContract` mints the id with `doc(collection(db,"contracts"))`, writes
  `contractId` back, and `setDoc`s once. Don't `addDoc` then `updateDoc`.
- **`getContracts` sorts in memory** by `updatedAt` desc — no Firestore `orderBy` (avoids a
  composite index), matching clients/projects.
- **`sendContract` is a `runTransaction`.** It verifies `status === 'draft'` and `lockedSnapshot`
  is empty, then freezes the snapshot + flips to `sent`. **Never overwrite an existing
  `lockedSnapshot`.** Future changes to a sent contract = void/resend, duplicate-to-draft, or
  versioning — none built yet.
- **Save Draft skips the required-field guard** (drafts may be incomplete); it only needs org + uid
  - selected project + client. **Send runs the full `guard()`** — all non-`optional` tokens must be
    filled. `isLocked = status !== 'draft'` disables both buttons once sent.

## Unsaved-changes guard

The builder warns before you leave with unsaved edits. `hasUnsavedChanges` compares a stable
`draftKey(values, scopeItems, selectedProjectId)` against `savedKeyRef` (re-baselined on every
successful save; ignored once locked). The interception + dialog live in the **shared**
`useUnsavedChangesGuard` hook (`src/hooks/use-unsaved-changes-guard.tsx`), not here — the builder just
passes `when: hasUnsavedChanges` and an `onSave` that persists the draft (returns `true` to proceed).
The hook handles a `beforeunload` listener plus a document-level capture-phase anchor-click
interceptor (App Router can't block soft navigation), and returns a ready `dialog` node to render.
Don't re-add a per-link `onClick` confirm — the global interceptor covers every internal link. Reuse
this hook for other forms with unsaved-state rather than copying the logic.

## Firestore rules

`contracts/{id}` has a block in [firestore.rules](../../../../../firestore.rules). Without it,
client-SDK writes hit the default deny. It enforces org-scoping plus: create must be a `draft` with
`lockedSnapshot == null`; once status leaves draft, only lifecycle/audit keys may change (so the
snapshot can't be rewritten). The draft→sent transition is allowed because the **pre-image** is still
a draft. **Rules must be deployed** (`firebase deploy --only firestore:rules`) for persistence to
work. When the portal is added, an unauthenticated client read needs a separate token-gated path —
not these org rules.
