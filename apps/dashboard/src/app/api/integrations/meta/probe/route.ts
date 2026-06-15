// apps/dashboard/src/app/api/integrations/meta/probe/route.ts
//
// TEMPORARY diagnostic. Visit this route in the browser (while signed in, after
// reconnecting Instagram with the new instagram_manage_insights scope) to dump
// the raw Graph API responses for your account. Once we know which metrics are
// actually available, this route should be DELETED — it bypasses normal auth and
// returns analytics for whatever org the active-organization-id cookie points to.

import { type NextRequest, NextResponse } from "next/server";

import { ACTIVE_ORG_COOKIE } from "@/lib/org-cookie";
import { getAdminDb } from "@/server/firebase-admin";

const GRAPH = "https://graph.facebook.com/v22.0";

async function call(label: string, url: string): Promise<[string, unknown]> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    return [label, await res.json()];
  } catch (error) {
    return [label, { error: error instanceof Error ? error.message : String(error) }];
  }
}

export async function GET(req: NextRequest) {
  const organizationId = req.cookies.get(ACTIVE_ORG_COOKIE)?.value;
  if (!organizationId) {
    return NextResponse.json({ error: "No active organization cookie." }, { status: 400 });
  }

  const secretSnap = await getAdminDb()
    .collection("organizations")
    .doc(organizationId)
    .collection("secrets")
    .doc("meta")
    .get();

  const token = secretSnap.exists ? (secretSnap.data()?.facebookPageAccessToken as string | undefined) : undefined;
  const igId = secretSnap.exists ? (secretSnap.data()?.instagramAccountId as string | undefined) : undefined;

  if (!token || !igId) {
    return NextResponse.json({ error: "No stored Meta token/account. Connect first." }, { status: 400 });
  }

  // ~14-day window for time-series metrics.
  const until = Math.floor(Date.now() / 1000);
  const since = until - 14 * 24 * 60 * 60;

  const q = (params: Record<string, string>) => new URLSearchParams({ ...params, access_token: token }).toString();

  // First, grab a few recent media ids so we can probe per-post insights.
  const [, mediaListRaw] = await call(
    "media_list",
    `${GRAPH}/${igId}/media?${q({ fields: "id,caption,media_type,timestamp,like_count,comments_count,permalink", limit: "5" })}`,
  );
  const firstMediaId = (mediaListRaw as { data?: { id?: string }[] })?.data?.[0]?.id;

  const probes: Promise<[string, unknown]>[] = [
    // Classic account insights (older metric set).
    call(
      "account_insights_classic",
      `${GRAPH}/${igId}/insights?${q({ metric: "reach", period: "day", since: String(since), until: String(until) })}`,
    ),
    // Newer total_value style (views/profile_views/accounts_engaged).
    call(
      "account_insights_total_value",
      `${GRAPH}/${igId}/insights?${q({ metric: "reach,views,profile_views,accounts_engaged", period: "day", metric_type: "total_value", since: String(since), until: String(until) })}`,
    ),
    // Follower count over time.
    call(
      "follower_count",
      `${GRAPH}/${igId}/insights?${q({ metric: "follower_count", period: "day", since: String(since), until: String(until) })}`,
    ),
    // Lifetime audience demographics.
    call(
      "audience_demographics",
      `${GRAPH}/${igId}/insights?${q({ metric: "follower_demographics", period: "lifetime", metric_type: "total_value", breakdown: "city" })}`,
    ),
    Promise.resolve<[string, unknown]>(["media_list", mediaListRaw]),
  ];

  if (firstMediaId) {
    probes.push(
      call(
        "first_media_insights",
        `${GRAPH}/${firstMediaId}/insights?${q({ metric: "reach,saved,likes,comments,shares,views,total_interactions" })}`,
      ),
    );
  }

  const results = Object.fromEntries(await Promise.all(probes));
  return NextResponse.json({ organizationId, instagramAccountId: igId, results }, { status: 200 });
}
