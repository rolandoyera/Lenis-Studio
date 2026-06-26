# Profile Feature — Agent Notes

> Global dev rules live in the repo root [AGENTS.md](../../../../../../../AGENTS.md). This file
> only captures Profile-specific context that isn't obvious from the code.

## Maintain this file

**Whenever you change Profile code ([page.tsx](./page.tsx), the invite-accept flow in
`src/app/(main)/auth/invite/page.tsx`, or the `users`/`mail` rules in `firestore.rules`), update
this file in the same change.** If a fact here is now wrong, correct it; if you change the invite
lifecycle, the doc key scheme, or the tenant gates, reflect it. A stale AGENTS.md is worse than
none — treat updating it as part of "done," not optional.

## What this is

A single client component ([page.tsx](./page.tsx)) that views and edits one user profile. It is
`Suspense`-wrapped because it reads `?uid=` via `useSearchParams`. Two modes:

- **Self** — no `?uid=`, or `?uid=` equal to the current user. Editable; saving also updates the
  Firebase Auth `displayName`.
- **Other** — `?uid=<someone>`. Read-only unless the logged-in user is an Admin. Role is editable
  **only** by an Admin viewing someone else's profile.

The edit form is a RHF + Zod modal (`profileSchema`), per the root form rules. The on-page fields
are display-only mirrors of state.

## The two-key `users` scheme (the thing to understand first)

`users/{id}` documents are keyed **two different ways** depending on lifecycle:

- **Pending invite** → keyed by **lowercased email** (`users/{emailKey}`), `status: "Pending"`,
  carrying `organizationId`, `role`, `fullName`. Created by an Admin elsewhere; this folder only
  _resends_ it.
- **Active user** → keyed by **Auth UID** (`users/{uid}`), `status: "Active"`.

The accept flow (`auth/invite/page.tsx`) reads the email-keyed pending doc, creates the UID-keyed
active doc copying `organizationId`/`role` from it, then **deletes** the email-keyed doc. So a
given person is email-keyed before activation and UID-keyed after.

`loadData` reads `users/{activeUid}` where `activeUid` is the `?uid=` param (or current uid). For a
pending user the list links with `?uid=<email>`, so `activeUid === emailKey` and the same code path
reads the pending doc. **The resend writes back to `users/{emailKey}` — same doc, consistent key.**
Don't "fix" one keying without the other; they are load-bearing as a pair.

## Tenant isolation — how it holds

Two independent gates, both required:

1. **Load-time gate (client).** `loadData` reads the target doc and bounces to `/dashboard/home`
   if `targetOrgId !== loggedInOrgId` ([page.tsx](./page.tsx), "Tenant isolation check"). So the
   Resend/Edit actions are only reachable for a same-org target.
2. **Rules gate (authoritative).** The resend's `setDoc(users/{emailKey}, {joinedDate}, merge)`
   is an _update_; `firestore.rules` only allows it via the Admin clause, which requires
   `resource.data.organizationId == userOrg()` and forbids changing `organizationId`. A
   cross-tenant resend is **denied at the rules layer**, not just hidden in the UI.

Org assignment on accept comes from the stored pending doc's `organizationId`, **not** the invite
URL (which carries only `?email=`). Never add an `organizationId`/`role` to the invite link or
read it from caller input — that would let a client spoof a tenant. The pending doc is the only
source of truth for the new user's org.

## Resend invite — what it does

`handleResendInvite` (Admin-only, only enabled when `status === "Pending"`):

1. Merges a fresh `joinedDate` onto `users/{emailKey}` (refreshes the invite timestamp; does not
   touch org/role/status).
2. Adds a doc to the top-level `mail` collection (the Firebase Trigger Email extension outbox)
   with the invite HTML and a link to `/auth/invite?email=<emailKey>`.

## Current issues / known weaknesses

- **`mail` is writable by any signed-in user.** `firestore.rules` has `match /mail/{mailId} {
allow create: if isSignedIn(); }` — no role/org scoping. Any authenticated account (any tenant,
  any role) can enqueue arbitrary `to`/`subject`/`html` and send mail from our identity. Not a
  cross-tenant _data leak_, but an abuse/phishing vector. **Deferred** (owner asked to hold). The
  intended fix is to move mail-sending into a server action and set `mail` to `write: false`
  (same pattern as `organizations/{orgId}/secrets`), or at minimum gate `create` to `isAdmin()`.
- **Pending invite docs are world-readable by email.** `users` `allow get` permits reading any
  `status == 'Pending'` doc with no auth — intentional (the invite page runs before the visitor
  has an account) but it exposes `fullName`, `role`, and `organizationId` to anyone who guesses an
  invited email. Accepted tradeoff; be aware it allows org-id enumeration.
- **Org name is hardcoded** as "Sarvian Design Group CRM" in the invite email body. Not
  tenant-aware — every org's invite says Sarvian. Fine while Sarvian is the only tenant; pull the
  org's display name from the organization doc when this goes truly multi-tenant.
- **`joinedDate` is overloaded.** On resend it's written as the invite-sent timestamp, but on
  activation it's rewritten as the real join time. The field name reads as "joined" in both places.
- **All gating outside the rules layer is client-side.** The Admin/self/role checks in `page.tsx`
  are UX only; the real boundary is `firestore.rules`. When changing access logic, change the rule,
  not just the component.
