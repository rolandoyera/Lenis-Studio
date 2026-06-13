# Issues

## Library + Vendors Simplification Pass

Scope: `apps/dashboard/src/app/(main)/dashboard/library`, `apps/dashboard/src/app/(main)/dashboard/vendors`, and related image helpers in `apps/dashboard/src/lib`.

### 1. Image mirroring logic is duplicated between library and vendor helpers - Done

- `apps/dashboard/src/lib/library-image-mirror.ts:7` and `apps/dashboard/src/lib/vendor-image-mirror.ts:6` both define the same Firebase-hosted URL check.
- `apps/dashboard/src/lib/library-image-mirror.ts:11` and `apps/dashboard/src/lib/vendor-image-mirror.ts:10` both map content types to extensions.
- `apps/dashboard/src/lib/library-image-mirror.ts:19` and `apps/dashboard/src/lib/vendor-image-mirror.ts:18` both convert base64 image payloads into `Blob`s.
- Both helpers call `fetchImageBytes`, convert the response, upload to Firebase, preserve already-hosted URLs, and track failures.

Suggested fix: extract a shared low-level helper such as `mirrorExternalImageUrl` or `mirrorExternalImages` that accepts the upload function and destination metadata. Keep library/vendor-specific shape mapping in the current files, but move the fetch/base64/Firebase-hosted/extension behavior into one place.

Why it helps: this is repeated network/storage behavior, so future fixes to image content types, failed fetch handling, or Firebase URL detection only need to happen once.

### 2. Storage cleanup after image replacement is repeated in detail pages - Done

- `apps/dashboard/src/app/(main)/dashboard/library/[itemId]/page.tsx:109` builds old image paths, compares them to new paths, then deletes removed files with `Promise.allSettled`.
- `apps/dashboard/src/app/(main)/dashboard/vendors/[vendorId]/page.tsx:100` builds replaced logo/hero paths, then deletes them with `Promise.allSettled`.

Suggested fix: extract a small helper around `deleteStorageFileByPath`, for example `deleteReplacedStoragePaths(oldPaths, newPaths)` or `deleteStoragePaths(paths, label)`. Keep the library/vendor rules local, but share the deletion loop and warning behavior.

Why it helps: this reduces repeated storage cleanup code and makes partial delete failures easier to log consistently.

### 3. Vendor social link formatting is duplicated between list and detail views - Done

- `apps/dashboard/src/app/(main)/dashboard/vendors/page.tsx:217` defines `getDisplayUrl`.
- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-hero.tsx:26` defines another `getDisplayUrl`.
- `apps/dashboard/src/app/(main)/dashboard/vendors/page.tsx:225` defines `formatSocialHref`.
- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-hero.tsx:34` defines another `formatSocialHref`.
- Both files then compute `websiteHref`, `instagramHref`, `pinterestHref`, `facebookHref`, `youtubeHref`, and `xTwitterHref`.

Suggested fix: move these into a local vendor helper, such as `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-links.ts`, with `formatSocialHref`, `getDisplayUrl`, and possibly `getVendorSocialLinks(vendor)`.

Why it helps: the list and detail views will format external links the same way, and the repeated social link block becomes easier to scan.

### 4. Library form still has a compatibility state wrapper around React Hook Form

- `apps/dashboard/src/app/(main)/dashboard/library/_components/use-library-item-form.ts:26` derives `formData` from `rhfForm.watch()`.
- `apps/dashboard/src/app/(main)/dashboard/library/_components/use-library-item-form.ts:29` labels `setFormData` as a compatibility setter.
- `apps/dashboard/src/app/(main)/dashboard/library/_components/library-item-form-dialog.tsx:280` consumes `{ formData, setFormData }`.
- The dialog still calls `setFormData` in many places, including `apps/dashboard/src/app/(main)/dashboard/library/_components/library-item-form-dialog.tsx:438`, `:489`, `:541`, `:636`, `:664`, `:722`, `:748`, `:777`, `:803`, `:830`, and `:866`.

Suggested fix: retire this gradually. First move simple fields to direct RHF `Controller` or `setValue` usage, then keep custom helper methods only for multi-field behaviors like pricing calculation, image ordering, and AI-applied fields.

Why it helps: the form is already RHF-based, but the compatibility wrapper keeps the older object-state mental model alive. Removing it should make validation, dirty state, and field updates easier to reason about.

### 5. Image picker/upload UI has enough overlap to justify small shared pieces

- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-form-dialog.tsx:55` keeps separate candidate selection state for logo and hero images.
- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-form-dialog.tsx:93`, `:128`, `:454`, and `:515` render image previews directly with repeated `<img>` blocks.
- `apps/dashboard/src/app/(main)/dashboard/library/_components/library-item-form-dialog.tsx:199`, `:967`, and `:1052` render similar image preview tiles.
- The library dialog also owns sortable gallery behavior around `apps/dashboard/src/app/(main)/dashboard/library/_components/library-item-form-dialog.tsx:991` and `:998`.

Suggested fix: do not extract the drag-and-drop gallery yet. Start smaller with shared presentational pieces like `ImagePreviewTile`, `ImageUploadButton`, or `ImageCandidateGrid`, then use them from both vendor and library forms.

Why it helps: this trims repeated preview markup without forcing vendor logo/hero selection and library sortable galleries into one over-general abstraction.

### 6. Vendor creation schemas are split between full vendor and quick vendor flows

- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-constants.ts:30` defines the full `vendorSchema`.
- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-constants.ts:57` defines `EMPTY_VENDOR_FORM`.
- `apps/dashboard/src/app/(main)/dashboard/library/_components/quick-vendor-dialog.tsx:27` defines a separate `quickVendorSchema`.
- `apps/dashboard/src/app/(main)/dashboard/library/_components/quick-vendor-dialog.tsx:34` defines a separate quick-vendor empty value.

Suggested fix: derive quick vendor validation from the shared vendor schema where practical, for example `vendorSchema.pick({ name: true, website: true })`, or move the quick schema/defaults into the vendor constants module.

Why it helps: vendor name and website cleanup rules stay consistent between creating a vendor from the vendor page and creating one inline from the library form.

### 7. The main form dialogs are large enough to split by section

- `apps/dashboard/src/app/(main)/dashboard/library/_components/library-item-form-dialog.tsx` is 1085 lines.
- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-form-dialog.tsx` is 859 lines.

Suggested fix: split along already-visible UI boundaries instead of creating generic abstractions. Good candidates are image/media section, core details, pricing/spec fields, AI autofill controls, and vendor contact/social fields.

Why it helps: smaller section components would make later changes safer, especially around image handling and RHF field wiring.

## Suggested Order

1. Extract vendor link helpers. This is low risk and localized.
2. Extract shared image mirroring primitives. This removes repeated network/storage code with a clear behavioral boundary.
3. Extract storage deletion helper. Keep deletion warnings consistent.
4. Simplify quick vendor schema/defaults against shared vendor constants.
5. Split small image preview/candidate UI pieces.
6. Gradually remove the library form compatibility `setFormData` wrapper.
7. Split the large dialogs after the smaller helpers are in place.
