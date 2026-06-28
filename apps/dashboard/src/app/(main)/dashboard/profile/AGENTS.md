# Profile Feature - Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Profile-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Profile code ([page.tsx](./page.tsx), the invite-accept flow in
`src/app/(main)/auth/invite/page.tsx`, or the `users`/`mail` rules in `firestore.rules`), update
this file in the same change.** If a fact here is now wrong, correct it; if you change the invite
lifecycle, the doc key scheme, or the tenant gates, reflect it. A stale AGENTS.md is worse than none

- treat updating it as part of "done," not optional.

## What this is

A single client component ([page.tsx](./page.tsx)) that views and edits one user profile. It is
`Suspense`-wrapped because it reads `?uid=` via `useSearchParams`. Two modes:

- **Self** - no `?uid=`, or `?uid=` equal to the current user. Editable; saving also updates the
  Firebase Auth `displayName`.
- **Other** - `?uid=<someone>`. Read-only unless the logged-in user is an Admin. Role is editable
  **only** by an Admin viewing someone else's profile.

The edit form is a RHF + Zod modal (`profileSchema` from [profile-schema.ts](./profile-schema.ts)),
per the root form rules. Save payload builders live in [profile-payloads.ts](./profile-payloads.ts)
so the client-side profile write has direct unit coverage. Invite resend runs through the
server-only `resendInvite` action (`src/server/invite-actions.ts`) so the browser never writes the
mail outbox directly. The on-page fields are display-only mirrors of state.

## The two-key `users` scheme (the thing to understand first)

`users/{id}` documents are keyed **two different ways** depending on lifecycle:

- **Pending invite** -> keyed by **lowercased email** (`users/{emailKey}`), `status: "Pending"`,
  carrying `organizationId`, `role`, `fullName`. Created by an Admin elsewhere; this folder only
  _resends_ it.
- **Active user** -> keyed by **Auth UID** (`users/{uid}`), `status: "Active"`.

The accept flow (`auth/invite/page.tsx`) reads the email-keyed pending doc, creates the UID-keyed
active doc copying `organizationId`/`role` from it, then **deletes** the email-keyed doc. So a given
person is email-keyed before activation and UID-keyed after.

`loadData` reads `users/{activeUid}` where `activeUid` is the `?uid=` param (or current uid). For a
pending user the list links with `?uid=<email>`, so `activeUid === emailKey` and the same code path
reads the pending doc. **The resend writes back to `users/{emailKey}` - same doc, consistent key.**
Don't "fix" one keying without the other; they are load-bearing as a pair.

## Tenant isolation - how it holds

Two independent gates, both required:

1. **Load-time gate (client).** `loadData` reads the target doc and bounces to `/dashboard/home` if
   `targetOrgId !== loggedInOrgId` ([page.tsx](./page.tsx), "Tenant isolation check"). So the
   Resend/Edit actions are only reachable for a same-org target.
2. **Server-action gate (authoritative for resend).** `resendInvite` verifies the Firebase ID token,
   loads `users/{uid}` with the admin SDK, requires Admin/SuperAdmin, and only resends a
   `status: "Pending"` invite whose `organizationId` matches the caller. A cross-tenant resend is
   denied server-side, not just hidden in the UI.

Org assignment on accept comes from the stored pending doc's `organizationId`, **not** the invite URL
(which carries only `?email=`). Never add an `organizationId`/`role` to the invite link or read it
from caller input - that would let a client spoof a tenant. The pending doc is the only source of
truth for the new user's org.

## Resend invite - what it does

`handleResendInvite` (Admin-only, only enabled when `status === "Pending"`) calls the server-only
`resendInvite` action:

1. Verifies the caller's Firebase ID token and Admin/SuperAdmin profile.
2. Confirms `users/{emailKey}` is a same-org pending invite.
3. Merges a fresh `joinedDate` onto `users/{emailKey}` (refreshes the invite timestamp; does not
   touch org/role/status).
4. Adds a doc to the top-level `mail` collection with server-built invite HTML and a link to
   `/auth/invite?email=<emailKey>`.

## Current issues / known weaknesses

- **`mail` is server-only.** `firestore.rules` denies all client reads/writes for `/mail`; invite and
  resend actions enqueue Trigger Email docs through firebase-admin after server-side authorization.
  Keep it that way - do not re-open `/mail` to the client SDK.
- **Pending invite docs are world-readable by email.** `users` `allow get` permits reading any
  `status == 'Pending'` doc with no auth - intentional (the invite page runs before the visitor has
  an account) but it exposes `fullName`, `role`, and `organizationId` to anyone who guesses an
  invited email. Accepted tradeoff; be aware it allows org-id enumeration.
- **Org name is hardcoded** as "Sarvian Design Group CRM" in the invite email body. Not tenant-aware
  - every org's invite says Sarvian. Fine while Sarvian is the only tenant; pull the org's display
    name from the organization doc when this goes truly multi-tenant.
- **`joinedDate` is overloaded.** On resend it's written as the invite-sent timestamp, but on
  activation it's rewritten as the real join time. The field name reads as "joined" in both places.
- **Client-side gates are UX only.** The Admin/self/role checks in `page.tsx` decide what controls
  are shown; the real resend boundary is `src/server/invite-actions.ts`, while direct profile edits
  are still bounded by `firestore.rules`. When changing access logic, update the authoritative layer,
  not just the component.
