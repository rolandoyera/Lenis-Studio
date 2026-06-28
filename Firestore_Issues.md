# Firestore Issues

This document captures findings from an overall review of the dashboard Firestore implementation. These are review observations, not a finalized remediation plan. Further investigation should be made before any changes are implemented, including confirming product requirements, role expectations, existing deployed rules, and current production data shape.

## High-Risk Findings

### Organization data rules are broad

Most organization-scoped collections allow any signed-in user in the organization to create, update, and delete records. This includes clients, leads, vendors, projects, library items, proposals, trades, and contracts.

If Contributors should have restricted permissions, or if deletes should be Admin-only, the current rules do not enforce that boundary.

Relevant file:

- `apps/dashboard/firestore.rules`

### Mail collection can be written by any signed-in user

The `mail` collection allows any authenticated user to create mail documents. If the Firebase Trigger Email extension is active, this could allow arbitrary email creation by any signed-in user.

Email creation should likely move behind a server action/Admin SDK path, or the rules should strictly validate allowed recipients and document shape.

Relevant files:

- `apps/dashboard/firestore.rules`
- `apps/dashboard/src/lib/db.ts`

### Storage rules are globally writable by any signed-in user

Storage paths for library images, vendor images, and organization branding allow reads and writes by any authenticated user. The rules do not enforce organization ownership or path ownership.

This means a signed-in user could potentially write to storage paths outside their own organization context.

Relevant file:

- `apps/dashboard/storage.rules`

**Status — Tier 1 done (rules-only):** `organizations/{orgId}/branding/...` now requires the path `orgId` to match the uploader's `users/{uid}.organizationId` (via a cross-service `firestore.get`), and all uploads must be an image under 15 MB with deletes still allowed. The flat `library/{p=**}` / `vendors/{p=**}` paths remain (so existing files keep displaying and stored-path deletes keep working) but are tightened to signed-in + valid-image-upload only.

**Resolved.** Uploads write to `library/{orgId}/{itemId}/...` and `vendors/{orgId}/{vendorId}/...` (`organizationId` threaded through the upload helpers in `db.ts`, the two image-mirror helpers, and all callers), each enforced by an org-checked Storage rule. The legacy flat blocks were removed after all flat-path files were cleared (the `library`/`vendors` collections were also reset), so cross-org isolation on library/vendors is fully enforced. Branding (`organizations/{orgId}/branding/...`) was already org-scoped and is enforced via the cross-service `firestore.get` (requires the one-time Storage→Firestore IAM grant).

**Note — cross-service IAM requirement:** because the branding rule uses `firestore.get`, the Cloud Storage for Firebase service agent must be granted a Firestore read role (the Firebase console prompts for this on publish; one-time grant).

**Future option — avoid the cross-service read via custom claims:** store `organizationId` in the user's Firebase Auth custom claims (set server-side with `setCustomUserClaims`) and check `request.auth.token.organizationId == orgId` in the rules instead of `firestore.get`. This removes the IAM dependency and the per-upload Firestore read cost, but requires setting the claim during user provisioning/org changes, backfilling existing users, and a token refresh for them to pick it up. Consider when convenient; not required for Tier 1/Tier 2.

## Medium-Risk Findings

### Deletes do not enforce referential cleanup

Parent records are deleted directly in several helpers, but Firestore does not cascade deletes. This can leave orphaned documents or stale references, such as projects for deleted clients, room items for deleted projects, contracts for deleted projects, notes under deleted clients, or library references to deleted vendors.

Relevant file:

- `apps/dashboard/src/lib/db.ts`

### Project room ownership can be mutated

Rules for `projectRooms` and `projectRoomItems` check the existing `projectId` on update, but do not require the incoming `projectId` to remain unchanged. A client could mutate ownership pointers into an invalid or cross-organization state unless the UI prevents it.

Relevant file:

- `apps/dashboard/firestore.rules`

### Diagnostics collection is broadly accessible

The `code` diagnostics collection allows read/write access to any signed-in user. If diagnostics contain scraped content, prompts, raw AI responses, or other internal data, this should probably be restricted to development or admin-only access.

Relevant files:

- `apps/dashboard/firestore.rules`
- `apps/dashboard/src/lib/db.ts`

### Audit-grade fields rely on client-generated values in many places

The app broadly uses client-side `Date.now()` timestamps and `Math.random()` IDs. This may be acceptable for ordinary UI records, but it is weaker for audit-grade data unless writes happen server-side or rules validate immutable fields.

Relevant file:

- `apps/dashboard/src/lib/db.ts`

## Scaling and Architecture Concerns

### Many list reads load full collections and sort in memory

Several helpers query all organization records for a collection and then sort in application code. This pattern is simple, but it can become slow and expensive as tenant data grows.

Future improvements should consider `orderBy`, `limit`, pagination, and explicit composite indexes.

Relevant file:

- `apps/dashboard/src/lib/db.ts`

### The model is relational but Firestore cannot enforce relationships

The data model contains many relational links, such as `clientId`, `projectId`, `vendorId`, `libraryItemId`, `contractId`, and `organizationId`. Firestore stores these as plain string fields and cannot enforce foreign keys or cascading constraints.

This is one of the stronger architectural reasons to consider Supabase/Postgres if the CRM continues to grow in reporting, permissions, billing, project accounting, or workflow complexity.

Relevant file:

- `apps/dashboard/src/lib/types.ts`

## Suggested Investigation Order

1. Confirm the intended permission matrix for `SuperAdmin`, `Admin`, and `Contributor`.
2. Compare repository rules with currently deployed Firestore and Storage rules.
3. Review contract lifecycle requirements and lock down client-writable fields.
4. Audit all collections that can trigger side effects, especially `mail`.
5. Define delete behavior for each parent-child relationship.
6. Identify high-volume list views and add pagination/index strategy.
7. Decide whether future complex workflows should remain in Firestore or move toward a relational database.
