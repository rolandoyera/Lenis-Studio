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
- [ ] **TEMP probe route — delete after use:** `src/app/api/integrations/meta/probe/route.ts`
      dumps raw Graph responses (account insights classic + total_value, follower_count,
      demographics, media list, per-media insights) for the active org. Bypasses normal auth;
      remove once we've confirmed which metrics this account returns.
- [x] **Instagram analytics — first cut (2026-06-14):** built into `/dashboard/marketing`.
      Server actions `fetchInstagramKpis` / `fetchInstagramReachTrend` / `fetchInstagramMedia`
      in `meta-actions.ts` (Graph calls in `meta-graph.ts`) power a KPI strip (reach, views,
      profile visits, accounts engaged), a daily reach chart, and a recent-posts table, with a
      7/30-day range selector. Confirmed-working metrics only — `graphJson()` throws on Graph
      errors so the UI shows a real message. Page gates on `getMetaConnection()` (connect prompt
      when not linked). NOTE: the old ecommerce mock components in `marketing/_components/`
      (KpiStrip, StoreTraffic, RecentOrders, etc.) are now unused — safe to delete.
- [ ] **Per-post insights:** posts table currently shows likes/comments from the media list.
      Add per-post reach/saves (extra Graph call per post), handling the "posted before business
      conversion" error (subcode 2108006) gracefully — see probe findings.
- [ ] **Follower growth + demographics:** deferred until the account has 100+ followers (Meta
      minimum for demographics). `follower_count` returns empty for now too. Add behind an empty
      state when there's data.
- [ ] **Analytics UI:** charts/cards for the above, matching the GA4 dashboard look.
- [ ] **Pending-token cleanup (minor):** if a user reaches the picker but never selects, the
      `secrets/metaPending` user token lingers until they reconnect (which overwrites it) or
      disconnect. Harmless and server-only, but could be swept on a TTL or cleared on the
      company page if we want it tidy.

## Notes

- All token handling and Firestore writes go through `firebase-admin` (`getAdminDb()`), which
  bypasses security rules — same trust model as the GA4 integration.
- Env vars used: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` (already in `.env`).
- The connected test account during build was `@lenisvisuals` (Page "Lenis Visuals").
