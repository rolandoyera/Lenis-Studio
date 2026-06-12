# Analytics Dashboard — Build-Out Plan

Roadmap for completing the GA4-powered analytics page (`src/app/(main)/dashboard/analytics`).
GA4 property is the Sarvian Design Group website (measurement ID `G-K0ZYTV5JSM`, repo: `oshrat/web`).

## Current state

| Widget | Status |
| --- | --- |
| GA4 connection checker | Live |
| KPI strip (users, pageviews, engagement, conversion rate) | Live |
| Top Pages | Live |
| Traffic Quality chart | **Mock data** |
| Top Traffic Sources | **Mock data** |
| Realtime Visitors | **Mock data** |
| Audience / Acquisition / Engagement / Conversions tabs | Empty |

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

## GA4 Admin (one-time, no code)

- [ ] Mark as **key events** (Admin → Events): `contact_form_submit`, `project_form_submit`, `phone_click`, `email_click`, `whatsapp_click`.
      Leave `project_button_click`, `contact_drawer_open`, and `form_start` as regular events — they are funnel steps, not leads.
      Note: events appear in the Admin list only after they have fired at least once in production.
- [ ] Verify `sessionConversionRate` in the KPI strip becomes non-zero once key events exist.

## Dashboard items to complete

### 1. Overview tab — replace mock widgets with live data

- [ ] **Traffic trend** (replaces the fictional "Traffic Quality" chart): `activeUsers` + `sessions` by `date` for the selected range, with previous-period comparison line. Server action in `analytics-actions.ts` following the `fetchKpiData` pattern.
- [ ] **Top Traffic Sources**: `sessions` by `sessionDefaultChannelGroup` (Sources tab), `sessionSource` (Referrers tab), `sessionCampaignName` (Campaigns tab). The existing three-tab bar chart UI maps 1:1.
- [ ] **Realtime Visitors**: `runRealtimeReport` with `activeUsers` (optionally by `unifiedScreenName`).

### 2. Conversions tab

- [ ] Key events trend: `keyEvents` by `date`.
- [ ] Leads by channel: `keyEvents` + `sessions` by `sessionDefaultChannelGroup` — "which channel produces inquiries".
- [ ] **Funnel widgets** (eventCount by eventName):
  - Project form: `project_button_click` → `form_start (modal)` → `project_form_submit`
  - Contact drawer: `contact_drawer_open` → `form_start (navbar_drawer)` → `contact_form_submit`
  - Shows opened-but-ignored vs. started-but-abandoned vs. completed.
- [ ] Lead breakdown by type: `phone_click` vs `email_click` vs form submits vs `whatsapp_click`.

### 3. Engagement tab

- [ ] Move existing Top Pages here (keep a compact version on Overview).
- [ ] **Top landing pages**: `landingPage` + `sessions` + `keyEvents` — which content starts journeys that convert.

### 4. Audience tab

- [ ] Geography by **city** (`city` + `activeUsers`) — local business, city > country. Flag-icons CSS already shipped.
- [ ] Devices: `deviceCategory` donut.
- [ ] New vs returning: `newVsReturning`.

### 5. Acquisition tab

- [ ] Full channel table: `sessionDefaultChannelGroup` with `sessions`, `engagementRate`, `keyEvents`.
- [ ] Source/medium detail: `sessionSource` / `sessionMedium`.

### Skipped intentionally

Session-duration deep dives, scroll tracking, demographics (age/gender) — low signal at small-business traffic volume; demographics rows are usually suppressed below Google's thresholds.
