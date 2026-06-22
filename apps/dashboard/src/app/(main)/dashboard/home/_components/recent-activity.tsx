"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { ActivityFeed } from "@/app/(main)/dashboard/_components/activity-feed";
import { useAuth } from "@/components/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentActivities } from "@/lib/db";
import type { Activity } from "@/lib/types";

const FEED_LIMIT = 8;

/**
 * Home dashboard "Recent Activity" cards. One org-wide fetch powers both cards,
 * split client-side by `importance` so we can eyeball what each write site
 * stamps:
 * - High — external / client-driven events (website leads, portal activity).
 * - Low  — internal studio activity (notes, manual leads, conversions).
 * Absent importance is treated as "low" (legacy rows). The conversion dual-write
 * is de-duped to a single row before splitting.
 */
export function RecentActivity() {
  const { organizationId, uid, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!organizationId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const orgId = organizationId; // stable string dependency; profile identity churns on each heartbeat

    // One-time fetch (no live listener). `withSpinner` gates the loading state so
    // the initial mount shows skeletons but focus-driven refetches update silently.
    const load = (withSpinner: boolean) => {
      if (withSpinner) setLoading(true);
      getRecentActivities(orgId, 50)
        .then((data) => {
          if (isMounted) setActivities(data);
        })
        .catch((error) => {
          console.error("Failed to load recent activities:", error);
        })
        .finally(() => {
          if (isMounted && withSpinner) setLoading(false);
        });
    };

    load(true);

    // Refresh on focus: re-run the fetch when the tab/window regains focus so the
    // feed feels fresh without holding an open Firestore listener.
    const refresh = () => {
      if (document.visibilityState === "visible") load(false);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [organizationId, authLoading]);

  const deduped = dedupeConversions(activities);
  const high = deduped
    .filter((a) => a.importance === "high")
    .slice(0, FEED_LIMIT);
  const low = deduped
    .filter((a) => a.importance !== "high")
    .slice(0, FEED_LIMIT);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <FeedCard
        title="High"
        activities={high}
        currentUserId={uid ?? undefined}
        loading={loading}
        emptyLabel="No high-importance activity yet."
      />
      <FeedCard
        title="Low"
        activities={low}
        currentUserId={uid ?? undefined}
        loading={loading}
        emptyLabel="No low-importance activity yet."
      />
    </div>
  );
}

function FeedCard({
  title,
  activities,
  currentUserId,
  loading,
  emptyLabel,
}: {
  title: string;
  activities: Activity[];
  currentUserId?: string;
  loading: boolean;
  emptyLabel: string;
}) {
  return (
    <div className="w-full">
      <Card className="pt-0">
        <CardHeader className="h-15 bg-muted/50 flex items-center">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-70 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ActivityFeed
              activities={activities}
              currentUserId={currentUserId}
              emptyLabel={emptyLabel}
              showSource
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * A lead→client conversion writes two activities (one per timeline). In the
 * org-wide feed that would show twice, so collapse the pair: both docs share
 * the same {leadId, clientId} as their source/entity ids in swapped order.
 */
function dedupeConversions(items: Activity[]): Activity[] {
  const seen = new Set<string>();
  const out: Activity[] = [];
  for (const a of items) {
    if (a.type === "lead_converted_to_client") {
      const key = [a.source.id, a.entity.id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(a);
  }
  return out;
}
