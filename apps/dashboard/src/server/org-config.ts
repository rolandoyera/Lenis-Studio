import { cache } from "react";

import { cookies } from "next/headers";

import { ACTIVE_ORG_COOKIE } from "@/lib/org-cookie";

import { getAdminDb } from "./firebase-admin";

interface OrgConfig {
  gaPropertyId?: string;
  gscSiteUrl?: string;
}

/**
 * Reads the active tenant's `config` map from organizations/{orgId}.
 *
 * Wrapped in React.cache so every analytics section rendering within a single
 * server request shares ONE Firestore read instead of reading the org document
 * per section. Resolution stays server-side and cookie-scoped — callers never
 * pass an org id — so tenant isolation is unchanged.
 *
 * Returns `null` when there is no active-organization cookie (the signal for
 * callers to fall back to their env var), or an OrgConfig (possibly empty) when
 * an org is active. A failed read yields `{}`, i.e. "configured nothing",
 * matching the previous per-resolver behavior of never falling back to env for
 * an active org.
 */
export const getActiveOrgConfig = cache(async (): Promise<OrgConfig | null> => {
  const cookieStore = await cookies();
  const organizationId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  if (!organizationId) return null;

  try {
    const orgSnap = await getAdminDb()
      .collection("organizations")
      .doc(organizationId)
      .get();
    return orgSnap.exists ? ((orgSnap.data()?.config ?? {}) as OrgConfig) : {};
  } catch (error) {
    console.error("Failed to resolve organization config:", error);
    return {};
  }
});
