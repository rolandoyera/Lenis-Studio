# Company / Organization Settings — Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Company-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Company code (this folder, the `companyProfile`/`branding`/`settings` shape in
`src/lib/types.ts`, the org helpers in `src/lib/db.ts`, or the `organizations/{orgId}` rules in
`firestore.rules`), update this file in the same change.** If a fact here is now wrong, correct it;
if you add/remove a field, section, dialog, or convention, reflect it. A stale AGENTS.md is worse
than none — treat updating it as part of "done," not optional.

## What this route is

`/dashboard/company` hosts **two unrelated things** stacked on one page ([page.tsx](./page.tsx)):

1. **Company Profile** — the org's own identity/branding/defaults, edited by org Admins.
   ([_components/company-profile-form.tsx](./_components/company-profile-form.tsx)).
2. **Instagram / Meta integration** — [company-meta-card.tsx](./company-meta-card.tsx), backed by
   `src/server/meta-actions.ts`. This predates the profile (the route started as the Meta card) and
   is a separate concern; Meta page-access tokens are server-only (`organizations/{orgId}/secrets`,
   denied to clients in `firestore.rules`). Don't entangle the two.

`page.tsx` is a server component (fetches Meta connection); the profile form is a `"use client"`
island that loads/saves its own data.

## Where the data lives — no new collection

Everything is stored **directly on the existing `organizations/{organizationId}` document**, under
three top-level fields (typed in `src/lib/types.ts`): `companyProfile` (identity + nested `address`,
plus `phone`/`phoneCountry`), `branding` (colors + light/dark logo + favicon URLs/paths), and
`settings` (timezone, currency, measurementUnit, defaultMarkupPercent, defaultTaxRate,
proposalExpirationDays). There is **no logo on `companyProfile`** — the only logos are the light/dark
pair under `branding`, alongside a light/dark **icon mark** pair (`iconLight*`/`iconDark*`) — a small
in-app icon (not a browser favicon), same convention: light variant for dark backgrounds, dark
variant for light backgrounds.

- Reads/writes go through `getOrganization` / `updateOrganization` in `src/lib/db.ts`
  (both `trace()`-wrapped, so they show in `window.__dbStats()`). `updateOrganization` runs
  `cleanUndefined`, and the form maps blank fields to `undefined` so they're omitted, not stored as
  `""`.
- Branding images upload via `uploadOrgBrandingImage(file, type, orgId)` →
  `organizations/{orgId}/branding/{logo-light|logo-dark|icon-light|icon-dark}.{ext}`. On save the form
  diffs old vs new paths and calls `deleteReplacedStorageFiles` to clean up replaced/removed assets
  (same pattern as Vendors/Library).

## Tenant isolation & who can edit — non-negotiable

The org doc is also the **billing/identity record**, so the `organizations/{orgId}` rules split
access (see `firestore.rules`):

- **Read:** any signed-in member of that org (`orgId == userOrg()`), or any SuperAdmin.
- **Update (client):** an **Admin of their own org**, but `hasOnly(['companyProfile', 'branding',
  'settings'])` — they can edit *only* those three fields. SuperAdmins keep blanket update.
- **`name`, `adminEmail`, `status`, `plan`, `config` stay SuperAdmin-only** — those are managed by
  the SuperAdmin-gated Tenants page (`../tenants/[tenantId]/page.tsx`, which writes `status` and
  `config`). Never widen the allowlist to include them, and never move profile saves to touch them.
- Keep the allowlist an **allowlist**, not a denylist: new org fields are then locked-down by
  default. `firestore.rules` is **not** CLI-deployed here — changes must be pasted into the Firebase
  console (Firestore → Rules → Publish) to take effect.

## Form architecture — display cards + per-section dialogs

The page is **read-only display cards**, each with a `⋮ → Edit` dropdown that opens a dialog for
just that section. There is no single page-wide "Save."

- `SectionEditDialog` is the shared shell: it owns a `useForm` over the **full** flat
  `CompanyProfileFormData`, seeds it from the current org on open, and on submit calls the section's
  `buildPatch(data)` → `persist(patch, prevPaths?, nextPaths?)`.
- `persist` (in `CompanyProfileForm`) updates `org` state **optimistically**, awaits
  `updateOrganization`, runs storage cleanup, and **reverts on error**.
- Because every dialog seeds from the full org, saving one section (e.g. `{ companyProfile }`)
  preserves the fields it doesn't show. Each section writes only its own top-level block
  (`companyProfile`, `branding`, or `settings`); the Settings dialog also silently injects
  `currency`/`measurementUnit` (see below).
- **Each section lives in its own file** — `company-info-section.tsx`, `settings-section.tsx`,
  `branding-section.tsx` each export that section's display card **and** its edit-dialog field group.
  Shared shell is in `section-dialog.tsx` (`SectionEditDialog`, `EditableCardHeader`, `LABEL_CLASS`,
  the `SectionDialogChildProps`/`PatchResult` types); the Country/Timezone combobox is
  `search-select.tsx`. `company-profile-form.tsx` is now just the orchestrator (load + `persist` +
  wire the three dialogs).

## Conventions that are easy to break

- **Flat form ↔ nested doc mapping lives in [_components/company-constants.ts](./_components/company-constants.ts).**
  `organizationToForm` (nested → flat strings) and `formToOrganizationUpdate` (flat → nested
  `companyProfile`/`branding`/`settings`). Edit fields in one place; keep both directions in sync.
- **Settings numbers are `number` in Firestore but strings in the form.** The schema validates them
  as numeric-or-empty strings; `numberOrUndef`/`numToStr` convert at the boundary. The
  markup/tax/expiration inputs sanitize on change (`sanitizeDecimal`/`sanitizeInteger`) so a pasted
  `"15%"` becomes `"15"` rather than failing validation.
- **Company Name falls back to `org.name`** until explicitly saved (intentional; mirrors how the
  tenant already has a name). **Currency / Measurement Unit are not user-editable** — there are no
  inputs and no display for them. `organizationToForm` defaults them to `USD` / `imperial`, so they
  are injected automatically on the **next Settings save** (not backfilled). This is deliberate:
  pin US defaults now so adding other markets later isn't a migration. To expose them, re-add inputs
  in `settings-section.tsx`; the schema/mapper fields still exist.
- **Phone is international, matching the Vendor form.** Uses `formatVendorPhone` /
  `isValidVendorPhone` with a `phoneCountry` (defaults to the address country). Do **not** swap in
  the US-only `formatPhone` here.
- **Reused from Vendors:** `COUNTRIES`, `countryName`, `regionLabelFor`, `formatVendorAddress` are
  imported from `../vendors/_components/vendor-constants`. The stored `address.formatted` string is
  generated on save via `formatVendorAddress`. Region label + ZIP/Postal adapt to the country.
- **Control types:** searchable lists (Country, Phone Country, Timezone) use the `Combobox`
  (`SearchSelect` helper). There is no `NativeSelect` in the app — don't reintroduce it.
