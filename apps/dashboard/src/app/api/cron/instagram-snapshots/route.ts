import { NextResponse } from "next/server";

import { snapshotAllConnectedInstagram } from "@/server/meta-snapshots";

// Insights pulls can take a while across many orgs; opt out of caching/static.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily Instagram snapshot job. Triggered by Vercel Cron, which sends
 * `Authorization: Bearer $CRON_SECRET`. Rejects anything else so the route
 * can't be invoked publicly.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await snapshotAllConnectedInstagram();
  return NextResponse.json({ ok: true, ...result });
}
