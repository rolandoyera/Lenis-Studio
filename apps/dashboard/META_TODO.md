# Instagram / Meta Integration — Where We Stand

Goal: connect each tenant's Instagram Business account (via the Facebook Graph API)
and surface its analytics in the dashboard, the same multi-tenant way GA4 works.

Status as of 2026-06-14: **OAuth connect + persistence + connection UI are done.**
No analytics charts yet — that's the next phase.

## What's built (done)

- [x] **OAuth login** (`src/app/api/integrations/meta/login/route.ts`) — reads the
      `active-organization-id` cookie, packs `{ organizationId, nonce }` into the OAuth
      `state`, and sets the nonce as a short-lived **httpOnly** cookie for CSRF protection.
      Bails to `?meta=no_org` if there's no active tenant.
- [x] **OAuth callback** (`src/app/api/integrations/meta/callback/route.ts`) — validates
      `state` against the cookie, exchanges the code → short-lived token → **long-lived
      token**, then fetches the Page, the connected Instagram Business account, and the
      profile snapshot, and writes both Firestore docs via `firebase-admin`.
- [x] **Split storage by sensitivity:**
      - `organizations/{orgId}` → `config.metaIntegration` — display data (username, name,
        picture URL, follower/post counts, page id/name). Readable by org members.
      - `organizations/{orgId}/secrets/meta` → the long-lived **Page access token** +
        `expiresAt`. Server-only; never reachable from a client.
- [x] **Types** (`src/types/meta.ts`) — `MetaIntegrationConfig` + `MetaSecrets`;
      `OrganizationConfig` in `src/lib/types.ts` now carries `metaIntegration?`.
- [x] **Server actions** (`src/server/meta-actions.ts`) — `getMetaConnection()` reads the
      status; `disconnectMeta()` clears the config field + deletes the secret doc.
- [x] **Company page UI** (`src/app/(main)/dashboard/company/page.tsx`) — shows the connected
      account (avatar, @username, follower/post counts, "Connected" badge) with a Disconnect
      button, or the Connect button when not linked.
- [x] **Firestore security rules** — `secrets/{secretId}` is `allow read, write: if false`
      (published to the Firebase console 2026-06-14). Subcollections default-deny anyway;
      this makes it explicit and future-proof.
- [x] **Multi-page account picker (2026-06-14):** if the user grants access to more than one
      Facebook Page, the callback stores **nothing** yet — it stashes only the long-lived user
      token at `secrets/metaPending` and redirects to `/dashboard/company?meta=select`. The
      company page opens a **picker dialog** (`company-meta-card.tsx`) listing each granted Page
      (with its linked IG username / follower count, or "No Instagram account") and connects
      **only the one chosen**. The temp token is deleted on selection; non-chosen accounts are
      never persisted. Single-page grants connect directly. Shared Graph helpers live in
      `src/server/meta-graph.ts`.
- [x] **Success modal + URL hygiene (2026-06-14):** a successful connect (direct or via the
      picker) shows a "Instagram connected" confirmation dialog. The `?meta=…` query param is
      cleared with `window.history.replaceState` on mount so a reload doesn't re-open dialogs
      (per AGENTS.md rule 3). The company card + both dialogs are one client island.

## Token lifecycle (reference — so the docs you keep reading make sense)

| Token | Lifespan | What we do with it |
| --- | --- | --- |
| User token from OAuth `code` | ~1 hour | Exchanged immediately, never stored |
| Long-lived user token | ~60 days | Used once to fetch the Page token |
| **Page access token** (stored) | Effectively non-expiring | All future Instagram Graph API calls |

The stored Page token is the durable one. "Non-expiring" still breaks if the user changes
their Facebook password, revokes the app, or Meta forces a refresh — see the recovery TODO below.

## Remaining tasks

- [ ] **Token-invalidation recovery (do this with the sync work):** when a Graph API call
      returns error code `190` (token expired/invalid), mark the integration disconnected and
      surface a "Reconnect Instagram" prompt on the company page. Nothing uses the token on a
      schedule yet, so there's no path that hits this error today — it belongs with the sync.
- [ ] **Refresh the profile snapshot on read/sync:** `instagramProfilePictureUrl` is a signed,
      expiring Meta CDN URL — re-fetch it (and follower/post counts) on each sync rather than
      trusting the stored copy long-term.
- [x] **Insights scope added (2026-06-14):** `instagram_manage_insights` added to the login
      scopes. **Requires a one-time reconnect** to grant it — the token stored before this date
      can't call the insights endpoints.
- [ ] **BLOCKER — enable the permission in the Meta App Dashboard:** requesting the scope
      currently fails with "Invalid Scopes: instagram_manage_insights" because the permission
      isn't enabled on the app. Fix in developers.facebook.com → the app → App Review →
      Permissions and Features (or Use cases → Customize) → enable `instagram_manage_insights`.
      **Standard Access** is enough for testing on our own account in dev mode; App Review is
      only needed later for clients' accounts. Connect is broken until this is enabled (we chose
      to keep the scope in rather than revert). Then reconnect — no code change needed.
- [x] **TEMP probe route — DELETED (2026-06-14):** served its purpose (confirmed account
      insights, follower_count, follower_demographics, media list, and per-media insights all
      return real data on org-sarvian). Removed because it bypassed auth and echoed the page token.
      To test reached/engaged demographics later, add a fresh minimal probe at that point.
- [x] **Instagram analytics — first cut (2026-06-14):** built into `/dashboard/marketing`.
      Server actions `fetchInstagramKpis` / `fetchInstagramReachTrend` / `fetchInstagramMedia`
      in `meta-actions.ts` (Graph calls in `meta-graph.ts`) power a KPI strip (reach, views,
      profile visits, accounts engaged), a daily reach chart, and a recent-posts table, with a
      7/30-day range selector. Confirmed-working metrics only — `graphJson()` throws on Graph
      errors so the UI shows a real message. Page gates on `getMetaConnection()` (connect prompt
      when not linked). NOTE: the old ecommerce mock components in `marketing/_components/`
      (KpiStrip, StoreTraffic, RecentOrders, etc.) are now unused — safe to delete.
- [ ] **Per-post insights — CONFIRMED working on active accounts (org-sarvian probe 2026-06-14):**
      per-media insights return `reach, views, saved, likes, comments, shares, total_interactions`
      (e.g. a carousel: reach 48, views 124, likes 7). One Graph call per post. The "posted before
      business conversion" error (subcode 2108006) was specific to lenisvisuals' pre-conversion
      post — still handle it gracefully (skip/—) since some posts will hit it. Would turn the
      recent-posts table from likes/comments into Reach / Views / Saves / Interactions columns.
- [ ] **Post thumbnails in the recent-posts table:** add `media_url,thumbnail_url` to the
      `fetchRecentMedia` fields, pick per media_type (IMAGE→media_url, VIDEO/REELS→thumbnail_url,
      CAROUSEL_ALBUM→fetch children[0] or placeholder), render a small fixed-size plain `<img>`
      (not next/image — the URLs are signed/expiring across many CDN subdomains). Re-fetched each
      load, never stored.
- [x] **Audience demographics (2026-06-14):** `fetchInstagramDemographics` pulls city, country,
      age, and gender follower breakdowns (`follower_demographics`, lifetime, total_value), shown
      as an Audience section on the marketing page. Empty state explains the 100-follower minimum.
      Built against org-sarvian (281 followers) which clears that threshold.
- [ ] **Follower growth chart — CONFIRMED returns data (org-sarvian probe 2026-06-14):**
      `follower_count` (period=day) returns daily net-new followers (e.g. +1 on Jun 4, +1 on Jun 8).
      Empty only for the tiny lenisvisuals account. Add as a daily/cumulative trend beside reach.
- [ ] **Analytics UI:** charts/cards for the above, matching the GA4 dashboard look.
- [ ] **Pending-token cleanup (minor):** if a user reaches the picker but never selects, the
      `secrets/metaPending` user token lingers until they reconnect (which overwrites it) or
      disconnect. Harmless and server-only, but could be swept on a TTL or cleared on the
      company page if we want it tidy.

## Audience / demographics — everything available (for review)

What Instagram exposes about audiences, so you can pick what to surface. "Followers" data is
lifetime; "reached" / "engaged" data needs a timeframe and only returns when there's recent
activity. All breakdowns come back as `{ dimension_values, value }` lists via the insights API.

**Already built — follower demographics** (`follower_demographics`, lifetime):
- [x] City, Country, Age, Gender (the complete set of follower breakdowns — nothing more exists
      for followers). Currently capped to **top 6 per card**.

**Available to add — same four cuts, different people:**
- [ ] **Reached audience demographics** (`reached_audience_demographics`): city / country / age /
      gender of accounts you *reached* (followers + non-followers who saw content). Needs a
      `timeframe` (last_14_days | last_30_days | last_90_days | prev_month | this_month |
      this_week). Answers "who am I reaching?"
- [ ] **Engaged audience demographics** (`engaged_audience_demographics`): same four cuts for
      accounts that *engaged* (liked / commented / saved). Same `timeframe` requirement. Answers
      "who actually interacts?"
- [ ] **PROBE FIRST:** both of the above depend on recent activity and may return empty for a
      low-activity account. Hit the probe (as org-sarvian) to confirm real data before building
      cards that could be blank.

**Granularity / display tweaks (cheap):**
- [ ] **Combined breakdowns:** request `breakdown=age,gender` in one call to get cross-cuts like
      "women 25-34" instead of separate Age and Gender cards.
- [ ] **Show full lists:** drop the top-6 cap to display every city / country / bucket.

**Not available (so we don't chase it):**
- Language / locale breakdown — the old `audience_locale` metric is deprecated; no replacement.
- Gender is only M / F / U (no finer split); age uses fixed buckets (13-17 … 65+).

## Notes

- All token handling and Firestore writes go through `firebase-admin` (`getAdminDb()`), which
  bypasses security rules — same trust model as the GA4 integration.
- Env vars used: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` (already in `.env`).
- The connected test account during build was `@lenisvisuals` (Page "Lenis Visuals").
