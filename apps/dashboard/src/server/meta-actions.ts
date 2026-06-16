"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { FieldValue } from "firebase-admin/firestore";

import { ACTIVE_ORG_COOKIE } from "@/lib/org-cookie";
import type { MetaIntegrationConfig, MetaPendingPage } from "@/types/meta";

import { getAdminDb } from "./firebase-admin";
import {
  type DemographicItem,
  fetchAccountKpis,
  fetchFollowerDemographics,
  fetchInstagramProfile,
  fetchPages,
  fetchReachTrend,
  fetchFollowerCount,
  fetchFollowerGains,
  fetchRecentMedia,
  getStoredMetaCreds,
  type IgMediaItem,
  type IgTrendPoint,
  storeMetaConnection,
} from "./meta-graph";

const NOT_CONNECTED = "Instagram isn't connected yet.";

const RANGE_DAYS: Record<string, number> = {
  "last-7-days": 7,
  "last-14-days": 14,
  "last-30-days": 30,
  "last-60-days": 60,
  "last-90-days": 90,
};

/** Current window + the equal-length window immediately before it (for "vs previous"). */
function rangeToWindows(range?: string): {
  current: { since: number; until: number };
  previous: { since: number; until: number };
  comparisonLabel: string;
} {
  const days = RANGE_DAYS[range ?? ""] ?? 30;
  const span = days * 24 * 60 * 60;
  const until = Math.floor(Date.now() / 1000);
  const since = until - span;
  return {
    current: { since, until },
    previous: { since: since - span, until: since },
    comparisonLabel: `previous ${days} days`,
  };
}

export interface KpiMetric {
  value: number;
  previousValue: number;
  /** Absolute percent change, e.g. "12.3%". */
  change: string;
  isPositive: boolean;
}

/** Percent change of `current` vs `previous`, mirroring the GA4 KPI comparison. */
function compareMetric(current: number, previous: number): KpiMetric {
  if (previous === 0) {
    return { value: current, previousValue: previous, change: "0.0%", isPositive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    value: current,
    previousValue: previous,
    change: `${Math.abs(pct).toFixed(1)}%`,
    isPositive: pct >= 0,
  };
}

async function getActiveOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

/** Returns the tenant's Meta integration config, or null when not connected. */
export async function getMetaConnection(): Promise<MetaIntegrationConfig | null> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return null;

  try {
    const snap = await getAdminDb().collection("organizations").doc(organizationId).get();
    const meta = snap.exists ? (snap.data()?.config?.metaIntegration as MetaIntegrationConfig | undefined) : undefined;
    return meta?.connected ? meta : null;
  } catch (error) {
    console.error("Failed to load Meta connection:", error);
    return null;
  }
}

/**
 * Lists the candidate Pages staged for the picker (when the user granted access
 * to more than one). Returns [] when there's no pending selection.
 */
export async function getMetaPendingPages(): Promise<MetaPendingPage[]> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return [];

  try {
    const pendingSnap = await getAdminDb()
      .collection("organizations")
      .doc(organizationId)
      .collection("secrets")
      .doc("metaPending")
      .get();

    const userAccessToken = pendingSnap.exists
      ? (pendingSnap.data()?.userAccessToken as string | undefined)
      : undefined;
    if (!userAccessToken) return [];

    const pages = await fetchPages(userAccessToken);

    return await Promise.all(
      pages.map(async (page): Promise<MetaPendingPage> => {
        const profile = await fetchInstagramProfile(page);
        return {
          pageId: page.id,
          pageName: page.name,
          instagramUsername: profile?.username ?? null,
          instagramName: profile?.name ?? null,
          followersCount: profile?.followersCount ?? null,
          hasInstagram: profile !== null,
        };
      }),
    );
  } catch (error) {
    console.error("Failed to load pending Meta pages:", error);
    return [];
  }
}

/** Connects the chosen Page from the picker and clears the pending selection. */
export async function selectMetaPage(
  pageId: string,
): Promise<{ success: boolean; error?: string; connection?: MetaIntegrationConfig }> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, error: "No active organization." };

  try {
    const orgRef = getAdminDb().collection("organizations").doc(organizationId);
    const pendingSnap = await orgRef.collection("secrets").doc("metaPending").get();
    const data = pendingSnap.exists ? pendingSnap.data() : undefined;

    const userAccessToken = data?.userAccessToken as string | undefined;
    if (!userAccessToken) {
      return { success: false, error: "Connection session expired. Please reconnect." };
    }
    const expiresAt = typeof data?.expiresAt === "number" ? data.expiresAt : undefined;

    const pages = await fetchPages(userAccessToken);
    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      return { success: false, error: "That page is no longer available. Please reconnect." };
    }

    const profile = await fetchInstagramProfile(page);
    if (!profile) {
      return { success: false, error: "That page has no linked Instagram account." };
    }

    const connection = await storeMetaConnection(organizationId, page, profile, expiresAt);
    await orgRef.collection("secrets").doc("metaPending").delete();
    revalidatePath("/dashboard/company");
    return { success: true, connection };
  } catch (error) {
    console.error("Failed to select Meta page:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export interface InstagramKpiComparison {
  reach: KpiMetric;
  views: KpiMetric;
  profileViews: KpiMetric;
  accountsEngaged: KpiMetric;
  comparisonLabel: string;
}

/** Account KPI totals (reach, views, profile visits, accounts engaged) with vs-previous comparison. */
export async function fetchInstagramKpis(
  range?: string,
): Promise<{ success: boolean; data?: InstagramKpiComparison; error?: string }> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, error: NOT_CONNECTED };

  try {
    const { current, previous, comparisonLabel } = rangeToWindows(range);
    const [cur, prev] = await Promise.all([
      fetchAccountKpis(creds, current.since, current.until),
      fetchAccountKpis(creds, previous.since, previous.until),
    ]);
    return {
      success: true,
      data: {
        reach: compareMetric(cur.reach, prev.reach),
        views: compareMetric(cur.views, prev.views),
        profileViews: compareMetric(cur.profileViews, prev.profileViews),
        accountsEngaged: compareMetric(cur.accountsEngaged, prev.accountsEngaged),
        comparisonLabel,
      },
    };
  } catch (error) {
    console.error("Failed to fetch Instagram KPIs:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load Instagram metrics." };
  }
}

/**
 * Live follower total plus a vs-previous-30-days comparison. `comparison` is null
 * when the account is under 100 followers (Instagram won't expose daily gains there).
 */
export async function fetchInstagramFollowers(): Promise<{
  success: boolean;
  data?: { followers: number; comparison: KpiMetric | null };
  error?: string;
}> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, error: NOT_CONNECTED };

  try {
    const until = Math.floor(Date.now() / 1000);
    const since = until - 30 * 24 * 60 * 60;
    const [followers, gains] = await Promise.all([fetchFollowerCount(creds), fetchFollowerGains(creds, since, until)]);
    // followers 30 days ago = current total minus net gains over the window.
    const comparison = gains === null ? null : compareMetric(followers, followers - gains);
    return { success: true, data: { followers, comparison } };
  } catch (error) {
    console.error("Failed to fetch Instagram followers:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load followers." };
  }
}

export interface InstagramReachTrend {
  points: IgTrendPoint[];
  /** Total reach over the current window, compared to the previous window. */
  comparison: KpiMetric;
  comparisonLabel: string;
}

/** Daily reach series for the current range, plus a vs-previous total for the comparison badge. */
export async function fetchInstagramReachTrend(
  range?: string,
): Promise<{ success: boolean; data?: InstagramReachTrend; error?: string }> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, error: NOT_CONNECTED };

  try {
    const { current, previous, comparisonLabel } = rangeToWindows(range);
    const [curPoints, prevPoints] = await Promise.all([
      fetchReachTrend(creds, current.since, current.until),
      fetchReachTrend(creds, previous.since, previous.until),
    ]);
    const total = curPoints.reduce((sum, p) => sum + p.reach, 0);
    const previousTotal = prevPoints.reduce((sum, p) => sum + p.reach, 0);
    return {
      success: true,
      data: { points: curPoints, comparison: compareMetric(total, previousTotal), comparisonLabel },
    };
  } catch (error) {
    console.error("Failed to fetch Instagram reach trend:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load reach." };
  }
}

/** Recent posts with engagement counts. */
export async function fetchInstagramMedia(limit = 10): Promise<{
  success: boolean;
  data: IgMediaItem[];
  error?: string;
}> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, data: [], error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, data: [], error: NOT_CONNECTED };

  try {
    return { success: true, data: await fetchRecentMedia(creds, limit) };
  } catch (error) {
    console.error("Failed to fetch Instagram media:", error);
    return { success: false, data: [], error: error instanceof Error ? error.message : "Failed to load posts." };
  }
}

export interface InstagramDemographics {
  cities: DemographicItem[];
  countries: DemographicItem[];
  age: DemographicItem[];
  gender: DemographicItem[];
}

/** Follower demographics (city, country, age, gender). Empty until the account has 100+ followers. */
export async function fetchInstagramDemographics(): Promise<{
  success: boolean;
  data?: InstagramDemographics;
  error?: string;
}> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, error: NOT_CONNECTED };

  try {
    const [cities, countries, age, gender] = await Promise.all([
      fetchFollowerDemographics(creds, "city"),
      fetchFollowerDemographics(creds, "country"),
      fetchFollowerDemographics(creds, "age"),
      fetchFollowerDemographics(creds, "gender"),
    ]);
    return { success: true, data: { cities, countries, age, gender } };
  } catch (error) {
    console.error("Failed to fetch Instagram demographics:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load demographics." };
  }
}

/** Clears the stored config and deletes the secret token for the active tenant. */
export async function disconnectMeta(): Promise<{ success: boolean }> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false };

  try {
    const orgRef = getAdminDb().collection("organizations").doc(organizationId);
    await orgRef.set({ config: { metaIntegration: FieldValue.delete() } }, { merge: true });
    await orgRef.collection("secrets").doc("meta").delete();
    revalidatePath("/dashboard/company");
    return { success: true };
  } catch (error) {
    console.error("Failed to disconnect Meta:", error);
    return { success: false };
  }
}
