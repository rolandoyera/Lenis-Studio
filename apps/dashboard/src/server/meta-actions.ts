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
  fetchRecentMedia,
  getStoredMetaCreds,
  type IgKpis,
  type IgMediaItem,
  type IgTrendPoint,
  storeMetaConnection,
} from "./meta-graph";

const NOT_CONNECTED = "Instagram isn't connected yet.";

function rangeToWindow(range?: string): { since: number; until: number } {
  const until = Math.floor(Date.now() / 1000);
  const days = range === "last-7-days" ? 7 : 30;
  return { since: until - days * 24 * 60 * 60, until };
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

/** Account KPI totals (reach, views, profile visits, accounts engaged) over a range. */
export async function fetchInstagramKpis(range?: string): Promise<{ success: boolean; data?: IgKpis; error?: string }> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, error: NOT_CONNECTED };

  try {
    const { since, until } = rangeToWindow(range);
    return { success: true, data: await fetchAccountKpis(creds, since, until) };
  } catch (error) {
    console.error("Failed to fetch Instagram KPIs:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to load Instagram metrics." };
  }
}

/** Daily reach series over a range, for the trend chart. */
export async function fetchInstagramReachTrend(
  range?: string,
): Promise<{ success: boolean; data: IgTrendPoint[]; error?: string }> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, data: [], error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, data: [], error: NOT_CONNECTED };

  try {
    const { since, until } = rangeToWindow(range);
    return { success: true, data: await fetchReachTrend(creds, since, until) };
  } catch (error) {
    console.error("Failed to fetch Instagram reach trend:", error);
    return { success: false, data: [], error: error instanceof Error ? error.message : "Failed to load reach." };
  }
}

/** Recent posts with engagement counts. */
export async function fetchInstagramMedia(): Promise<{
  success: boolean;
  data: IgMediaItem[];
  error?: string;
}> {
  const organizationId = await getActiveOrgId();
  if (!organizationId) return { success: false, data: [], error: NOT_CONNECTED };
  const creds = await getStoredMetaCreds(organizationId);
  if (!creds) return { success: false, data: [], error: NOT_CONNECTED };

  try {
    return { success: true, data: await fetchRecentMedia(creds, 10) };
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
