# Analytics Dashboard — Remaining Work

The GA4-powered analytics page (`src/app/(main)/dashboard/analytics`) is fully built: all five tabs
(Overview, Audience, Acquisition, Engagement, Conversions) query live GA4 data via the server actions
in `src/server/analytics-actions.ts`. GA4 property is the Sarvian Design Group website
(measurement ID `G-K0ZYTV5JSM`, repo: `oshrat/web`).

What's left is deployment + GA4 Admin configuration, then one small code follow-up.

## Remaining tasks

- [x] **Deploy the oshrat site** with the tracking events (deployed 2026-06-11).
- [ ] **Mark key events** in GA4 Admin → Events: `contact_form_submit`, `project_form_submit`, `phone_click`, `email_click`, `whatsapp_click`.
      Leave `project_button_click`, `contact_drawer_open`, and `form_start` as regular events — they are funnel steps, not leads.
      Note: events appear in the Admin list only after they have fired at least once in production.
- [ ] **Verify** the KPI strip's conversion rate becomes non-zero and the Conversions tab populates.
- [ ] **Register `form_type` custom dimension** in GA4 Admin → Custom definitions (event-scoped, event parameter `form_type`).
- [ ] **Code follow-up (after the dimension exists ~24h):** query `customEvent:form_type` in `fetchConversionsData` to split `form_start` per form, and add it as the middle step in both Form Funnels (open → started → submitted). Currently shown as a combined count under the funnels.

## Multi-tenant analytics — staged plan (started 2026-06-12)

Goal: onboard CRM clients' GA4 properties per organization instead of the single env-var connection.
Failure states across all analytics widgets now show a uniform "Setup required" warning badge
(`_components/analytics-setup-required.tsx`). To preview the unconfigured state, temporarily
rename `GA_PROPERTY_ID` in `.env.local` and restart.

- [x] **Stage 1 (code):** `src/server/ga4.ts` prefers `GA_SERVICE_ACCOUNT_KEY` (raw or base64 JSON),
      falls back to the legacy `GA_CLIENT_ID`/`GA_CLIENT_SECRET`/`GA_REFRESH_TOKEN` OAuth vars.
      Config checks centralized in `getConfiguredPropertyId()` in `analytics-actions.ts`.
- [x] **Stage 1 (console):** service account `crm-analytics@designer-crm-499221.iam.gserviceaccount.com`
      created (project `designer-crm-499221`, Analytics Data API enabled), key in `.env.local` as
      `GA_SERVICE_ACCOUNT_KEY` (base64), Viewer on the SDG GA4 property, legacy OAuth vars deleted.
- [x] **Stage 2 (verified 2026-06-12):** per-tenant property resolution — auth context writes the
      `active-organization-id` cookie; analytics actions resolve the org's `config.gaPropertyId` via
      `firebase-admin` (`FIREBASE_SERVICE_ACCOUNT_KEY` env). With an org cookie there is NO env
      fallback (tenants can't see each other's data); env `GA_PROPERTY_ID` applies only without org
      context. SDG property ID is now set on org-sarvian's tenant config.
- [x] **Vercel env swap (2026-06-12):** `GA_SERVICE_ACCOUNT_KEY` + `FIREBASE_SERVICE_ACCOUNT_KEY` added
      (legacy `GA_CLIENT_*`/`GA_REFRESH_TOKEN` vars removable); local JSON key files deleted —
      regenerate from the consoles if ever needed. Takes effect on next deploy.
- [x] **Firestore security rules (published 2026-06-12, smoke-tested):** org-scoped rules live in
      `firestore.rules` + `storage.rules` (repo copies are the source of truth; paste into console
      to change). Spent migration scripts deleted; `dump-users.ts` kept but needs a `firebase-admin`
      port before next use.
- [ ] **org-demo fallback cleanup:** `auth-context.tsx` / `auth-guard.tsx` still default broken or
      uninvited profiles into `org-demo`. Decide whether to hard-fail instead. Never put real data
      in org-demo.
- [ ] **Stage 3:** tenant-page GA4 onboarding card — service-account email with copy button,
      property ID field validation, per-tenant "Test connection" button; onboarding checklist doc.
- [ ] **Stage 4 (before clients log in):** verify Firebase ID tokens in server actions instead of
      trusting the org cookie (requires `firebase-admin`).

## Website tracking events (reference)

Events sent by the marketing site via `gtag` (see `oshrat/web/src/lib/gtag.ts`):

| Event | Fires when | Params |
| --- | --- | --- |
| `project_button_click` | "Start a project" CTA pressed | `button_location`, `button_text` |
| `contact_drawer_open` | Navbar contact drawer opened | — |
| `form_start` | First focus inside a form (once per mount) | `form_type`: `navbar_drawer` \| `modal` |
| `contact_form_submit` | Contact drawer form sent successfully | `form_type: navbar_drawer` |
| `project_form_submit` | Project modal form sent successfully | `form_type: modal` |
| `phone_click` | `tel:` link clicked | `link_location` |
| `email_click` | `mailto:` link clicked | `link_location` |
| `whatsapp_click` | WhatsApp link clicked | `link_location` |
