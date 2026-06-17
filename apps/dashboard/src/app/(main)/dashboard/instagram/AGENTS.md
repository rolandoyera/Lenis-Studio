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

## TEMP — remove later

- `_components/instagram-refresh-button.tsx` + the `refreshInstagramSnapshot` action are a temporary
  manual trigger for the snapshot job. Remove the button file, its use in `page.tsx`, and the action
  once the cron is trusted.
