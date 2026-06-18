# Analytics Feature — Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Analytics-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Analytics code (this folder or the `src/server/{ga4,gsc,analytics-actions,
search-console-actions,org-config}.ts` modules), update this file in the same change.** If a fact
here is now wrong, correct it; if you add/remove a data source, action, tab, or convention, reflect
it. A stale AGENTS.md is worse than none — treat updating it as part of "done," not optional.

## Where the data comes from

Server logic lives in `src/server/`, not this folder. Two external APIs, two separate quotas:

- `ga4.ts` — the GA4 Data API client singleton (`getGA4Client`). Creds via service account
  (`GA_SERVICE_ACCOUNT_KEY`) or legacy OAuth. **All report calls are funneled through one
  process-wide concurrency limiter** wrapped onto `runReport`/`runRealtimeReport` (see below).
- `analytics-actions.ts` — `"use server"` actions for every GA4-backed section
  (`fetchKpiData`, `fetchTrafficTrend`, `fetchRealtimeData`, `fetchTopPagesData`,
  `fetchTrafficSources`, `fetchAudienceData`, `fetchAcquisitionData`, `fetchLandingPages`,
  `fetchConversionsData`, `testGA4Connection`).
- `gsc.ts` / `search-console-actions.ts` — Google Search Console (the "Google" tab only). A
  **different** API and quota from GA4; `fetchSearchTotals`/`fetchTopSearchQueries`/`fetchTopSearchPages`.
- `org-config.ts` — `getActiveOrgConfig()`, the single cookie-scoped read of
  `organizations/{orgId}.config` shared by both the GA4 and GSC property/site resolvers.

## Tenant isolation — non-negotiable

Property/site are resolved **server-side only**, from the `ACTIVE_ORG_COOKIE`, never from caller
input. `getConfiguredPropertyId` (GA4) and `getConfiguredSiteUrl` (GSC) read
`getActiveOrgConfig()`: with an active org, only that org's `config.gaPropertyId` /
`config.gscSiteUrl` counts — **no env fallback**, so one tenant can never see another's data.
Env vars (`GA_PROPERTY_ID`, `GSC_SITE_URL`) apply **only** when there is no org cookie.
Never add a propertyId/siteUrl prop or action argument — that would let a client spoof another
tenant. The Admin SDK in `org-config.ts` bypasses security rules; keep it server-only.

## Rules that are easy to break

- **All tab sections render server-side every request, even inactive tabs.** Sections passed as
  `children` into the client `<Tabs>`/`<TabsContent>` (see [page.tsx](./page.tsx)) are still
  executed on the server to build the RSC payload. So one page load fans out **every** section's
  actions, not just the visible tab's — ~19 GA4 reports total.
- **GA4 has a concurrent-request cap.** That ~19-report fan-out (plus dev Fast Refresh re-firing
  it on every save) blows the quota → `RESOURCE_EXHAUSTED`. The limiter in `ga4.ts`
  (`MAX_CONCURRENT_GA4_REQUESTS = 5`) is the guard: it queues excess calls instead of failing.
  Don't bypass it by calling the GA4 SDK directly — always go through `getGA4Client()`.
- **The org-config read is deduped with `React.cache()`.** `getActiveOrgConfig` collapses what
  used to be one `organizations/{orgId}` read per section into one read per request. Don't
  reintroduce per-section org reads.
- **`window.__dbStats()` does not see Analytics reads.** It only counts `trace()`-wrapped ops
  (`trace()` and `__dbStats` are defined in `src/lib/db-trace.ts`, and called only from
  `src/lib/db.ts`). The Admin-SDK org read and the GA4/GSC API calls go through neither, so they're
  invisible to it — expect the panel to under-report on this route.
- **`GA4ConnectionChecker` is a client component** ([ga4-connection-checker.tsx](./_components/ga4-connection-checker.tsx))
  that calls `testGA4Connection()` on mount. That's a *separate* request from the SSR render, so a
  single page visit produces two `getActiveOrgConfig` reads (one SSR, one from this checker) — expected.
- **Range comes from `?range=` search param**, default `last-24-hours`, threaded as a `range` prop
  into sections. `last-24-hours` switches GA4 trend dimensions to hourly (`dateHour`).
