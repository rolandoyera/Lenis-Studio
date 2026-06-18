# Vendors Feature — Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Vendors-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Vendors code (this folder, or the vendor-related helpers in
`src/lib/{db,vendor-image-mirror,image-mirror}.ts` and the `autofillVendorFromUrl` action in
`src/server/ai-actions.ts`), update this file in the same change.** If a fact here is now wrong,
correct it; if you add/remove a field, action, helper, or convention, reflect it. A stale
AGENTS.md is worse than none — treat updating it as part of "done," not optional.

## What this feature is

A vendor directory (trade vendors / procurement reps). Two routes, both **client components**:

- [page.tsx](./page.tsx) — the directory: searchable, category-filtered grid of `VendorCard`s,
  plus the "Add Vendor" dialog.
- [[vendorId]/page.tsx]([vendorId]/page.tsx) — a single vendor profile: hero, linked library
  items, account/contact/notes cards, and edit/delete.

## Files in this folder

- `_components/vendor-constants.ts` — the **single source of truth** for the form: `vendorSchema`
  (Zod), `VendorFormData` (inferred type), `VENDOR_CATEGORIES`, `EMPTY_VENDOR_FORM`, `vendorToForm`
  (Vendor → form), and `cleanTrailingSlash`. The `Vendor` Firestore type itself lives in
  `@/lib/types`.
- `_components/vendor-form-dialog.tsx` — the add/edit dialog (RHF + `zodResolver`), image uploads,
  the "Enrich with AI" flow, and the `ImagePickerDialog` for choosing among scraped candidates.
  Re-exports the constants module so callers import everything from here.
- `_components/vendor-links.ts` — pure URL helpers: `getVendorSocialHrefs` (normalizes the 6
  social/website fields into `https://…` hrefs or `null`), `formatSocialHref`, `getDisplayUrl`
  (strips scheme/`www`/trailing slash for tooltips).
- `_components/vendor-gradient.ts` — deterministic fallback gradient from the vendor name's first
  char, used when there's no hero/logo image.
- `_components/vendor-hero.tsx`, `vendor-header.tsx`, `vendor-items.tsx` — detail-page pieces
  (banner card, title + actions menu, linked-library-items list).

## Where the data comes from

All persistence is in `src/lib/db.ts` (Firestore client SDK, top-level `vendors` collection keyed
by `vendorId`):

- `getVendors(organizationId)` — directory query, filtered by `organizationId`, sorted by
  `createdAt` desc.
- `getVendor(vendorId)` — single doc; **does not filter by org** (see tenant isolation below).
- `addVendor` / `updateVendor` / `deleteVendor`.
- `getVendorLibraryItems(orgId, vendorId)` — the linked catalog items shown on the detail page and
  used to **block deletion** when non-empty.
- `uploadVendorImage` (browser File) / `uploadVendorImageBlob` (server-mirrored blob) — Firebase
  Storage uploads returning `{ url, path }`.

## Adding library items from the detail page (reuses the Library form)

The detail page can create a library item pre-linked to the vendor. It **reuses the Library
feature's form directly** — no fork: it hosts `useLibraryItemForm()` and `LibraryItemFormDialog`
from `../../library/_components/`, exactly as `library/page.tsx` does (the dialog is stateless and
the host owns submission). Specifics:

- The "Add Items" button lives in `VendorItems` (`onAddItem` prop). Opening calls
  `itemForm.reset({ vendorId: vendor.vendorId })` to seed the vendor.
- `LibraryItemFormDialog` is passed `lockVendor` so the vendor combobox + "Quick Add" become a
  read-only field — the item can't be reassigned away from this vendor. Pass `vendors={[vendor]}`
  and a no-op `onQuickAddVendor`.
- Submit mirrors `library/page.tsx`'s handler: `mirrorExternalImagesToFirebase` → `addLibraryItem`
  (with `vendor.organizationId`) → prepend to local `items` (which also keeps the delete-guard count
  current). Give the dialog a distinct `uploaderId` so its hidden file input can't collide.
- **Editing an item is NOT done here** — `VendorItems` links each row out to
  `/dashboard/library/{itemId}`. Keep it that way; don't add an edit path on this page.

## Tenant isolation — read this before touching the detail route

`getVendor(vendorId)` returns **any** org's vendor — there is no server-side org filter (vendor docs
are addressed by a guessable id). The detail page is responsible for the check:
[[vendorId]/page.tsx]([vendorId]/page.tsx) compares `vendorData.organizationId !== organizationId`
and redirects to the directory if it doesn't match. **Keep that guard.** If you add another caller
of `getVendor`, re-apply the same org check yourself.

## Images: external URLs are mirrored into our Storage

AI enrichment and manual entry can produce **external** image URLs (vendor's own CDN). On every
save, both routes call `mirrorVendorImagesToFirebase(...)` (`src/lib/vendor-image-mirror.ts`) before
writing the doc: any non-Firebase-hosted `logoUrl`/`heroImageUrl` is downloaded and re-uploaded to
our Storage, and the doc stores the mirrored URL + `…Path`. Don't persist a raw external image URL —
go through the mirror so links don't rot and `DashboardImage` can serve them.

- On **edit**, the detail page also calls `deleteReplacedStorageFiles(prevPaths, nextPaths)` to GC
  the old logo/hero blobs, and **aborts the update if that cleanup throws** (object-not-found is
  ignored internally). Keep that ordering: clean up, then `updateVendor`.
- Uploads are capped at 5MB client-side in the form dialog.

## AI enrichment ("Enrich with [assistant]")

The website field's button calls `autofillVendorFromUrl(url)` (`src/server/ai-actions.ts`, a
`"use server"` action; Gemini + Jina scrape, keys server-only). It returns scalar fields (name,
category, address, rep, socials) plus `logoCandidates`/`imageCandidates` arrays. When multiple image
candidates come back (`showImagePicker`), `ImagePickerDialog` opens so the user picks logo + hero;
the candidate buttons remain available afterward via the "Select … Candidate" buttons. Enrichment
only fills form state — nothing is saved until the user submits.

## Conventions easy to break

- **Form changes are three-touch.** A new vendor field means updating `vendorSchema`,
  `EMPTY_VENDOR_FORM`, **and** `vendorToForm` in `vendor-constants.ts`, plus rendering a `Controller`
  in `vendor-form-dialog.tsx`. Miss one and RHF/Zod will silently drop or mistype the field.
- **Phone/ZIP go through shared helpers.** Format with `formatPhone`/`formatZip` on change, build
  `tel:` links with `normalizePhone`, validate via `isValidUsPhone`/`isValidUsZip` in the schema.
  Never write a local formatter (root AGENTS.md rule).
- **Social/website URLs are stored slash-trimmed and rendered via `vendor-links.ts`.** The schema
  `.transform(cleanTrailingSlash)`s them and the fields `onBlur`-clean too. Always derive hrefs with
  `getVendorSocialHrefs` rather than using the raw stored value — empty fields must resolve to
  `null` so the icon renders disabled.
- **Deletion is gated by linked items.** If `getVendorLibraryItems` is non-empty the delete dialog
  refuses and lists the items; only an empty result allows `deleteVendor`. Don't bypass this.
- **`organizationId` is the effect dependency, not `profile`.** Both routes depend on the stable
  `organizationId` string from `useAuth` (the `profile` object identity churns each heartbeat). See
  the project memory note on effect deps — keep it that way.
- **Deep-link triggers.** The directory honors `?search=` and `?add=true` query params on mount and
  immediately clears `?add=true` via `window.history.replaceState` (root AGENTS.md rule #3). Preserve
  the cleanup so reloads don't re-open the dialog.
- **`vendorId` is generated client-side** (`vendor-<random>`) and reused as the Storage upload
  prefix so images land under the right vendor even before the doc is created.
