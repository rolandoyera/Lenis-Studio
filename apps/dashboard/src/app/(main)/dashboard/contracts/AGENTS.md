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
persists the result, plus a client portal that delivers, displays, and **e-signs** that contract.
Still intentionally minimal — **do not add**: in-app template editing, or a version-history UI. The
in-app "Print / PDF" action is still just the browser print dialog (the _final signed_ PDF is a
separate server-generated artifact, see "Contract delivery & signing").

The **client portal** now supports the full delivery + signing workflow (see "Client portal" and
"Contract delivery & signing" below): send-for-signature, e-sign consent, typed client signature,
the pre-authorized company signature, a final dual-signature PDF, and an append-only audit trail.

Routes: `contracts/page.tsx` is the list (reads real `getContracts`, renders them in the shared
`TanTable`, and uses an eye-icon link per row to open the editor);
`new/page.tsx` renders `<ContractBuilder />` (create); `[contractId]/page.tsx` fetches one contract
(`getContract`, with an org-match tenant guard) and renders `<ContractBuilder contract={…} key={id}/>`
to edit it. `ContractBuilder` takes an optional `contract` prop — when present it seeds `values`,
`scopeItems`, `selectedProjectId`, `contractId`, and `status` from it (the `key` forces a remount so
those `useState` initializers re-run per contract). Opening a non-draft contract shows it locked
(saves and project changes disabled); the dashboard editor still renders from the live fields, while
the **client portal** is the read-only viewer that renders from `lockedSnapshot`.
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
  `contract-template.ts` changes later. **The client portal reads `lockedSnapshot`, never the live
  draft fields** (see "Client portal" below).

Hard rules that bit us / are easy to break:

- **Numeric `Date.now()` timestamps everywhere — never `serverTimestamp()`/`Timestamp`.** The whole
  app uses epoch-ms numbers, and `cleanUndefined()` (`JSON.parse(JSON.stringify(...))`, used by
  every writer) would silently destroy a Firestore `FieldValue` sentinel. This applies to nested
  fields too (`lockedSnapshot.lockedAt`).
- **Draft create is a server action.** `createContract(userId, data)` in
  `src/server/contract-actions.ts` (`"use server"`, admin SDK) mints the id, allocates a
  `contractCode`/`contractNumber` from the `organizations/{orgId}/counters/contractCodes` sequence in
  a transaction, and writes the draft once. The old client-side `addContract` in `db.ts` is gone. Org
  comes from the active-org cookie; `userId` is passed by the builder. Reference codes are internal
  labels — they never replace `contractId`.
- **`getContracts` sorts in memory** by `updatedAt` desc — no Firestore `orderBy` (avoids a
  composite index), matching clients/projects.
- **Sending now runs server-side**, not via the client `db.ts`. The builder's Send button opens a
  confirmation modal (company-authorization language from `@/lib/contract-text`) and calls the
  `sendContractForSignature` **server action** (`src/server/contract-signing.ts`, admin SDK). That
  action freezes the snapshot, computes `contractVersionId` + `contractHash`, stamps
  `companySignatureAuthorization` from the org-configured signer, mints the portalAccess token,
  writes the `contract_sent` audit event, and emails the link via Brevo. The old client-side
  `sendContract` transaction in `db.ts` has been **removed** — the tightened update rule would reject
  it anyway (a client can no longer write `status: 'sent'` or `lockedSnapshot`), and leaving a broken
  path around invited a future caller. Sending is server-only. **Never overwrite an existing
  `lockedSnapshot`.**
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
client-SDK writes hit the default deny. It enforces org-scoping plus a **draft-only** client surface:

- **Create** is `if false` — denied to the client SDK. Draft creation is server-only
  (`createContract`, admin SDK) so every contract is assigned a `contractCode`/`contractNumber` from
  the org counter; a client-SDK create would bypass that sequence. (The old draft-only create
  allowlist is gone with the client-side `addContract`.)
- **Update** is allowed only while the contract **stays a draft AND only draft-editable fields
  change.** It constrains the _post-image_, not just the pre-image: `request.resource.data.status ==
'draft'`, `get('lockedSnapshot', null) == null`, `updatedBy == request.auth.uid`, and a
  `diff(...).affectedKeys().hasOnly([...])` allowlist of `ContractDraftInput` + `updatedBy`/
  `updatedAt`.
- **Delete** is allowed only while `status == 'draft'`. Once sent, a contract is an audit record:
  locked to client writes and **not deletable client-side**. (No `deleteContract` helper exists yet;
  when added it must target drafts only.)

The security comes from the post-image constraint + allowlists (they block flipping status, writing
`lockedSnapshot`, or forging signature/lifecycle/attribution fields); the `get()` default is just
robustness against a missing field (its failure mode is _deny_, never _allow_). Keep the allowlists in
sync with the `Contract` write shape — if you add/remove a draft-editable field, update both rules.

Everything **past draft** — send, viewedAt, signing/execution, **and voiding** — runs through the
firebase-admin SDK, which bypasses rules. So once sent the client can't edit, delete, or void it; in
particular **voiding is a server action** that stamps `voidedBy`/`voidedAt` (the client update rule
can't reach a non-draft and the allowlist excludes those fields, so a client can never void). The
`contracts/{id}/audit/*` subcollection denies all client access (server-only). **Rules must be
deployed** (`firebase deploy --only firestore:rules`). The `portalAccess` collection denies client
writes (org-scoped reads only); all portal reads/writes go through firebase-admin.

## Client portal

A read-only, **unauthenticated** client view of a sent contract. Routes live OUTSIDE this folder at
`src/app/portal/[accessToken]/…` (deliberately not in the `(main)` group, so no dashboard auth
guard/sidebar). The server access layer is [`src/server/portal.ts`](../../../../../server/portal.ts).

- **`portalAccess/{id}` collection** (typed `PortalAccess` in `src/lib/types.ts`) is a token-gated
  pointer to an existing `contracts/{id}` doc — contracts are **never moved**. It stores
  `tokenHash` (SHA-256 of the access token; the raw token lives only in the emailed link), `status`
  (`active|completed|expired|revoked`), `expiresAt`, `viewedAt`, and the `organizationId/clientId/
projectId/contractId` it grants access to.
- **Validation is fully server-side** (`resolvePortalContract`): hash the URL token → match
  `tokenHash` → require not `revoked`/`expired` and not past `expiresAt` → require `access.contractId`
  matches the route → load the contract → require its org/client/project match the access record.
  Both `active` (open for signing) and `completed` (already signed — still viewable/downloadable
  read-only) render; only `revoked`/`expired` are blocked. Any identity/existence mismatch returns
  `not_found` so the portal never confirms which contracts exist. Expired/unavailable failures render
  the branded `PortalMessage`, which names the org ("contact <org> for a new one") — the resolver
  attaches `orgName` (via `getOrgName`, legal→display→org name) on those paths since a valid token has
  already identified the org; `not_found` paths call `notFound()`, which renders
  `portal/[accessToken]/not-found.tsx` — a generic in-shell 404 (the layout can't resolve org branding
  for a bad token, so it shows the default app brand and names no firm). The portal header/footer stay
  consistent across all cases.
- **Identity verification gate (phone last-4).** Before any contract data renders, the client must
  prove identity. On **Send**, `createContractPortalAccess` reads the client's phone, stores only a
  salted SHA-256 of the last 4 digits (`verificationPhoneLast4Hash`, salted by `portalAccessId` —
  never the plain digits) plus `verificationMethod: 'phone_last4'` and `failedVerificationAttempts: 0`;
  send is blocked if the client has no usable phone. The landing page (`portal/[accessToken]/page.tsx`)
  is the gate: it shows the OTP-style `PortalVerifyForm` (4-digit input) until `access.verifiedAt` is
  set, a lock notice once `verificationLockedAt` is set, or the "review" hand-off when verified. The
  form submits only `{accessToken, contractId, phoneLast4}` to the `verifyPortalAccess` server action
  (in `contract-signing.ts`), which compares the salted hash **server-side**, sets `verifiedAt` on
  success, or increments `failedVerificationAttempts` and sets `verificationLockedAt` after
  `MAX_VERIFICATION_ATTEMPTS` (5). The expected digits never reach the browser. The contract page
  independently `redirect()`s back to the landing page when `!access.verifiedAt` (defense in depth),
  and `signContract` also refuses to sign unless `verifiedAt` is set and the link isn't locked.
- **Renders from `lockedSnapshot` only** (`PortalContractDocument`), reusing the template's pure
  render helpers. Internal-only fields (audit, ids, status) are never passed to the portal. **Once
  `fully_executed`, the on-screen document is hidden** and the page shows only the `PortalSignedState`
  download box (signing is done — re-showing the agreement only muddies whether action is still
  needed). The signed PDF (same snapshot) stays downloadable via the token-gated route.
- **Open tracking** (`recordPortalOpen`, in `contract-signing.ts`): stamps `portalAccess.viewedAt`
  once, advances a still-`sent` contract to `viewed`, and writes a `portal_opened` audit event,
  **deduped within 30 min** per access token (`hasRecentPortalOpen`). Best-effort; never blocks render.
- Portal routes are `noindex/nofollow` (robots metadata in the portal layout).

## Contract delivery & signing

The full e-sign workflow. Statuses are now
`draft → sent → viewed → fully_executed` with `expired`/`voided` off-ramps. Sending **is** the
company's signature authorization — there is no separate approval step. Server modules:

- **`src/server/contract-signing.ts`** (`"use server"`) — the only writer of contract lifecycle past
  draft. `sendContractForSignature` (freeze + authorize + mint token + email + audit),
  `recordPortalOpen`, and `signContract`. Security-critical values are **server-determined**:
  `contractVersionId` (minted), `contractHash` (SHA-256 of the canonical `lockedSnapshot`),
  timestamps, the recipient email (read from the `clients/{id}` doc, not the UI), and the company
  signer identity (from `OrgSettings.contractSigner`). The signer config is set in **Company
  Settings**; sending fails with a clear error if it's missing. The signing link's lifetime is
  `OrgSettings.contractExpirationDays` (Company Settings), defaulting to `DEFAULT_TTL_DAYS` (30) when
  unset or non-positive; it's passed as `ttlDays` to `createContractPortalAccess` (sets
  `portalAccess.expiresAt`) and surfaced in the email footer ("This link will expire in X days").
- **Signing** is a typed adopted signature: the client types their name + accepts the exact consent
  text (`ELECTRONIC_SIGNATURE_CONSENT_TEXT` in `@/lib/contract-text`). `signContract` re-validates the
  token, status (`sent`/`viewed`), and that the persisted snapshot still hashes to `contractHash`,
  then in one transaction sets `fully_executed` + `clientSignature` + `executedAt` and completes the
  token. It writes `electronic_signature_consent_accepted` (with the frozen consent text) and
  `contract_signed`, then runs the **post-execution artifact pipeline** (order matters, all
  best-effort — a failure is logged but never unwinds the already-executed contract): generate the
  executed PDF → store it → reference it on the contract → reference it in the project's documents →
  email the client a copy → write `contract_fully_executed`. See "Executed PDF artifact" below.
- **Audit trail** (`src/server/contract-audit.ts`) — append-only `contracts/{id}/audit/{eventId}`
  subcollection, typed `ContractAuditEvent`. Evidence chain: contract*sent → email*\* (Brevo) →
  portal_opened → consent → signed → fully_executed. Use the distributive `ContractAuditEventInput`
  type when writing. Raw Brevo payloads go to **private Storage** (`storeRawBrevoPayload`), never the
  contract doc; only the path is referenced on the normalized event.
- **Brevo** (`src/server/brevo.ts`) — `sendContractEmail` attaches contract metadata as an
  `X-Mailin-custom` header so the webhook (`src/app/api/webhooks/brevo/route.ts`) can attribute
  delivery events back to the contract. `metadata` is **optional**: the post-sign confirmation email
  omits it (and the contract tag) so it stays OUT of the signing-delivery certificate chain — the
  webhook skips events with no contract metadata. `attachments` (base64 `content` + `name`) carries
  the executed PDF on the confirmation email. **Graceful when `BREVO_API_KEY` is unset** (logs +
  reports "not configured"; the rest of the flow still works). Email labels stay precise
  (delivered/bounced/blocked/sent) — Brevo proves delivery to an address, never that the client read
  it. Optional `BREVO_WEBHOOK_SECRET` guards the webhook via `?secret=`.
- **Executed PDF artifact** (`src/server/contract-pdf.tsx`, `@react-pdf/renderer`) — one combined,
  immutable document: the frozen contract body + both signature blocks + a signature certificate
  (version id, hash, delivery facts, signer details, IP/UA). Built **only** from the server-loaded
  `lockedSnapshot` + server-side signature/execution data (never live draft fields, never browser DOM).
  `generateAndStoreFinalContractPdf` returns `{ path, fileName, buffer }` and stores it once at the
  **stable** path `organizations/{orgId}/contracts/{contractId}/executed/{contractId}-executed.pdf`
  (a contract executes exactly once, so no version suffix). This is the **canonical permanent record
  copy — do not regenerate it for normal use.** On signing, `signContract` records it on the contract
  (`executedFileUrl`, `executedFilePath`, `executedFileName`, `executedFileGeneratedAt`; the legacy
  `finalPdfPath`/`finalPdfGeneratedAt` are kept in sync to the same path for the portal route) and
  attaches the **exact same bytes** (the returned `buffer`, not a re-render) to the confirmation email.
  - **Two download routes, both stream from private Storage (never a public URL):** the client's
    **token-gated** `portal/[accessToken]/contract/[contractId]/download` (re-validates access; reads
    `executedFilePath ?? finalPdfPath`; regenerates on demand only if missing — for legacy contracts),
    and the dashboard's **org-gated** `api/project-documents/[documentId]/download` (resolves the
    `projectDocuments` record, checks the `ACTIVE_ORG_COOKIE` org matches, streams; **never**
    regenerates).
  - **Timestamps**: all contract times are stored as epoch-ms (UTC instants). The certificate/
    signature-block formatter (`fmtDate` in `src/lib/contract-pdf-document.tsx`) renders **UTC always,
    plus the org's configured timezone** when set — each labeled with its zone abbreviation, so the
    certificate is self-describing regardless of where it was generated. The zone comes from
    `OrgSettings.timezone` (Company Settings), fetched via `getOrgTimezone` and threaded as the
    `timeZone` prop into `<ContractPdf>` from both the real generator and the dev `pdf-preview`. Never
    format these times without an explicit `timeZone` — a bare `toLocaleString` would silently use the
    server's zone (UTC on Vercel) with no label.
- **Project document reference** (`src/server/project-documents.ts`) — the executed PDF surfaces in
  the project's **Files** tab without duplicating bytes. `attachExecutedContractToProject` upserts a
  `projectDocuments/{contract-<contractId>}` record (deterministic id → idempotent on re-run) pointing
  at the same Storage `filePath`, with `fileUrl` = the org-gated dashboard download route. The record
  is typed `ProjectDocument` (`type: "contract"`, `contractId`, `projectId`, `title`, `fileName`,
  `fileUrl`, `filePath`, `createdBy: "system"`). Firestore rule: `projectDocuments` is org-scoped
  read, **client writes denied** (server-only, like `portalAccess`/audit) — keep this rule and the
  `Contract`/`ProjectDocument` write shapes in sync. The Files tab (`ProjectFilesCard`, read via
  `getProjectDocuments(orgId, projectId)` — queried by org, filtered to the project in memory) lists
  documents with a Download button hitting `fileUrl`.
- **Post-sign confirmation email** (`src/server/contract-signed-email-template.ts` →
  `buildContractSignedEmailHtml`) — sent to the client by `sendExecutedContractConfirmation` in
  `contract-signing.ts` once executed, with the executed PDF attached (the exact stored bytes).
  Branding (company name, dark logo, phone) is pulled best-effort from the org; sender is the org
  contract signer. **No audit metadata** is attached (see Brevo note), so it doesn't pollute the
  signing-delivery certificate.
- **Env:** `FIREBASE_STORAGE_BUCKET` (optional; defaults to `<project>.firebasestorage.app`),
  `BREVO_API_KEY`, `BREVO_WEBHOOK_SECRET` (all optional — features degrade gracefully).
