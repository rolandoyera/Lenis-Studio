# Instagram Feature — Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Instagram-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Instagram code (this folder or the `src/server/meta-*.ts` modules), update
this file in the same change.** If a fact here is now wrong, correct it; if you add/remove a
data source, action, cron, or convention, reflect it; when the TEMP section ships or is removed,
delete it. A stale AGENTS.md is worse than none — treat updating it as part of "done," not optional.

## Where the data comes from

Server logic lives in `src/server/`, not this folder:

- `meta-graph.ts` — raw Graph API calls (`GRAPH = .../v22.0`). Reads creds via `getStoredMetaCreds`.
- `meta-actions.ts` — `"use server"` actions the UI calls.
- `meta-snapshots.ts` — daily history + the `getLatestSnapshot` fallback helper. **Not** `"use server"` (internal, not a public action).

## The connect flow lives here (moved from /dashboard/company)

`_components/instagram-connect.tsx` ("use client") owns connecting:

- **Disconnected** → a centered "Connect your Instagram" empty-state card (the page body renders
  nothing else when `getMetaConnection()` is null). Connect button → `/api/integrations/meta/login`.
- **Multi-Page grant** → the callback redirects to `?meta=select`; `page.tsx` fetches
  `getMetaPendingPages()` (only on that param) and the component opens a picker. On pick it calls
  `selectMetaPage` then does a full `window.location.assign("/dashboard/instagram?meta=connected")`
  so the server re-renders with the data tabs + success dialog in one shot.
- **Single Page** → callback connects directly and lands on `?meta=connected` (success dialog).
- URL hygiene: `replaceState` to `/dashboard/instagram` strips `?meta=…` so reloads don't re-fire.

All `?meta=…` redirects point at `/dashboard/instagram` (callback `route.ts`, login `route.ts`'s
`no_org`, and `revalidatePath` in `meta-actions.ts`). The OAuth `redirect_uri` registered with Meta
is unchanged — it's still `/api/integrations/meta/callback` (`META_REDIRECT_URI`); only the
post-callback landing page moved.

**No Disconnect in the UI by design.** `disconnectMeta` stays in `meta-actions.ts` for later
SuperAdmin exposure, but nothing surfaces it. To switch accounts, reconnect (the callback upserts).

## Two data modes — keep them straight

1. **Live (on-demand):** most UI pulls from the Graph API at request time (`cache: "no-store"`).
   Always current; costs one Graph call per load. This is the default for reach, views, posts,
   demographics, headline, followers.
2. **Stored snapshots (history):** the daily cron writes one doc per day to
   `organizations/{orgId}/instagramSnapshots/{YYYY-MM-DD}`. This is the **only** source of
   long-range history — Meta only exposes rolling windows and never backfills.

## Rules that are easy to break

- **`config.metaIntegration.followersCount` is a display cache, NOT source of truth.** Snapshots
  are its only writer. Display logic is `live ?? cached ?? "—"`. Do not write it on page load.
- **Snapshot fields mix levels and flows.** `followersCount` is a point-in-time level; `reach`,
  `views`, `profileViews`, `accountsEngaged`, `likes`, `comments`, `websiteClicks` are 24h flows.
  Don't chart them on the same axis.
- **Reach is unique-per-day.** Summing daily reach across days over-counts repeat viewers.
- **Fallback pattern:** `fetchInstagramKpis` tries live, and on Graph failure serves the latest
  snapshot with `source: "fallback"` + `asOf`. The strip shows an "As of {date}" label then.
  Only the strip has this — other live reads have no snapshot equivalent.

## The cron

- Route: `src/app/api/cron/instagram-snapshots/route.ts`. Auth via `Authorization: Bearer $CRON_SECRET`.
- Schedule: `vercel.json` → daily `0 6 * * *` (06:00 UTC). Vercel root dir is `apps/dashboard`.
- Loops every org where `config.metaIntegration.connected == true`; per-org errors are isolated.
- No manual/UI trigger by design — the daily cron is the only writer. If you ever need an on-demand
  capture, `snapshotInstagramForOrg(orgId)` in `meta-snapshots.ts` is the entry point.
