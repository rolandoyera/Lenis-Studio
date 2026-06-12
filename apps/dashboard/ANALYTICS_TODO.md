# Analytics Dashboard — Remaining Work

The GA4-powered analytics page (`src/app/(main)/dashboard/analytics`) is fully built: all five tabs
(Overview, Audience, Acquisition, Engagement, Conversions) query live GA4 data via the server actions
in `src/server/analytics-actions.ts`. GA4 property is the Sarvian Design Group website
(measurement ID `G-K0ZYTV5JSM`, repo: `oshrat/web`).

What's left is deployment + GA4 Admin configuration, then one small code follow-up.

## Remaining tasks

- [ ] **Deploy the oshrat site** with the tracking events (added 2026-06-11) so they start firing in production.
- [ ] **Mark key events** in GA4 Admin → Events: `contact_form_submit`, `project_form_submit`, `phone_click`, `email_click`, `whatsapp_click`.
      Leave `project_button_click`, `contact_drawer_open`, and `form_start` as regular events — they are funnel steps, not leads.
      Note: events appear in the Admin list only after they have fired at least once in production.
- [ ] **Verify** the KPI strip's conversion rate becomes non-zero and the Conversions tab populates.
- [ ] **Register `form_type` custom dimension** in GA4 Admin → Custom definitions (event-scoped, event parameter `form_type`).
- [ ] **Code follow-up (after the dimension exists ~24h):** query `customEvent:form_type` in `fetchConversionsData` to split `form_start` per form, and add it as the middle step in both Form Funnels (open → started → submitted). Currently shown as a combined count under the funnels.

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
