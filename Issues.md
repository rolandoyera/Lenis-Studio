# Issues

Audit scope: `apps/dashboard` redundancies and inconsistencies. No application code was changed.

## Higher Priority

### Profile settings form bypasses the app's form standards

- `apps/dashboard/src/app/(main)/dashboard/profile/page.tsx:80` through `apps/dashboard/src/app/(main)/dashboard/profile/page.tsx:103` keeps profile and password form values in individual `useState` calls instead of React Hook Form.
- `apps/dashboard/src/app/(main)/dashboard/profile/page.tsx:468` and `apps/dashboard/src/app/(main)/dashboard/profile/page.tsx:544` submit plain forms through local handlers instead of RHF + Zod.
- `apps/dashboard/src/app/(main)/dashboard/profile/page.tsx:49` defines a local `formatPhoneNumber`, and `apps/dashboard/src/app/(main)/dashboard/profile/page.tsx:597` uses it in `onChange`, bypassing shared `formatPhone`.

Why it matters: this is inconsistent with the project rule that new forms should use RHF, `Controller`, and Zod, and phone fields should use the shared helpers in `@/lib/utils`.

### Invite acceptance duplicates phone validation and formatting

- `apps/dashboard/src/app/(main)/auth/invite/page.tsx:35` validates phone values with local digit checks.
- `apps/dashboard/src/app/(main)/auth/invite/page.tsx:56` defines another local `formatPhoneNumber`.
- `apps/dashboard/src/app/(main)/auth/invite/page.tsx:312` formats the phone field with that local helper.

Why it matters: the shared phone helper already handles leading US country code normalization and display formatting. This duplicate logic can drift from the rest of the CRM forms.

### Product/vendor scraping fetches are not consistently marked `no-store`

- `apps/dashboard/src/server/weather-actions.ts:19` uses `cache: "no-store"` as expected.
- `apps/dashboard/src/server/ai-actions.ts:302` fetches raw product HTML without `cache: "no-store"`.
- `apps/dashboard/src/server/ai-actions.ts:309` and `apps/dashboard/src/server/ai-actions.ts:989` use `next: { revalidate: 0 }` for Jina Reader fetches instead of the explicit `cache: "no-store"` pattern used elsewhere.
- `apps/dashboard/src/server/ai-actions.ts:985` fetches vendor homepage HTML without `cache: "no-store"`.

Why it matters: the code has two cache-control styles for scraping flows. The repo instructions specifically call out stale scraping/weather cache states and ask for explicit `cache: "no-store"`.

## Redundancies

### `home` and `default` dashboard sections appear duplicated

- `apps/dashboard/src/app/(main)/dashboard/home/page.tsx:5` through `apps/dashboard/src/app/(main)/dashboard/home/page.tsx:9` imports and renders the same component set as `apps/dashboard/src/app/(main)/dashboard/default/page.tsx:1` through `apps/dashboard/src/app/(main)/dashboard/default/page.tsx:5`.
- Both folders duplicate `MetricCards`, `PerformanceOverview`, `SubscriberOverview`, `data.json`, and `recent-customers-table` modules. Examples:
  - `apps/dashboard/src/app/(main)/dashboard/home/_components/metric-cards.tsx:6`
  - `apps/dashboard/src/app/(main)/dashboard/default/_components/metric-cards.tsx:6`
  - `apps/dashboard/src/app/(main)/dashboard/home/_components/performance-overview.tsx:232`
  - `apps/dashboard/src/app/(main)/dashboard/default/_components/performance-overview.tsx:232`
  - `apps/dashboard/src/app/(main)/dashboard/home/_components/recent-customers-table/table.tsx:71`
  - `apps/dashboard/src/app/(main)/dashboard/default/_components/recent-customers-table/table.tsx:71`

Why it matters: any change to the default dashboard can drift between two route trees unless the duplication is intentional.

### Vendor gradient helper is duplicated

- `apps/dashboard/src/app/(main)/dashboard/vendors/page.tsx:40` defines `CARD_GRADIENTS` and `apps/dashboard/src/app/(main)/dashboard/vendors/page.tsx:50` defines `vendorGradient`.
- `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-hero.tsx:23` defines the same gradient list and `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-hero.tsx:33` defines another `vendorGradient`.

Why it matters: the vendor list and vendor detail hero can visually drift if one list is updated and the other is missed.

### Register form looks like an orphaned/demo component

- `apps/dashboard/src/app/(main)/auth/_components/register-form.tsx:23` exports `RegisterForm`, but repo search did not find an import/use outside the file.
- `apps/dashboard/src/app/(main)/auth/_components/register-form.tsx:34` shows a toast saying "You submitted the following values".
- `apps/dashboard/src/app/(main)/auth/_components/register-form.tsx:37` renders `JSON.stringify(data, null, 2)` into that toast.

Why it matters: this appears to be scaffold/demo behavior rather than production auth behavior, and it creates confusion around invite-only user setup.

## Consistency Notes

### Library item form suppresses resolver typing

- `apps/dashboard/src/app/(main)/dashboard/library/_components/use-library-item-form.ts:21` casts `zodResolver(libraryItemSchema)` to `any`.

Why it matters: other forms wire the Zod resolver without suppressing type checks. This may be hiding a real schema/type mismatch in the most complex catalog form.

### Modal/dialog visual overrides are applied ad hoc

- Several feature dialogs override the shared dialog surface with `bg-popover/95` or `bg-popover/98` plus `backdrop-blur-md`, including:
  - `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-form-dialog.tsx:67`
  - `apps/dashboard/src/app/(main)/dashboard/vendors/_components/vendor-form-dialog.tsx:322`
  - `apps/dashboard/src/app/(main)/dashboard/projects/_components/project-form-dialog.tsx:99`
  - `apps/dashboard/src/app/(main)/dashboard/library/_components/quick-vendor-dialog.tsx:84`
  - `apps/dashboard/src/app/(main)/dashboard/tenants/_components/create-tenant-dialog.tsx:126`

Why it matters: the app already has shared dialog styling in `components/ui/dialog.tsx`. Repeating surface overrides in feature code weakens the design-system rule to use existing components and theme utilities first.

