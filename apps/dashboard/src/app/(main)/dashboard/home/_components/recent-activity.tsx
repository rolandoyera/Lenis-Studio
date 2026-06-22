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
 * Home dashboard "Recent Activity" cards. One org-wide fetch powers all four
 * cards, sliced client-side:
 * - Studio   — everything (conversion's dual write is de-duped to one row).
 * - Website  — lead activity whose acquisition channel is "website".
 * - Instagram— lead activity whose acquisition channel is "instagram".
 * - Clients  — activity whose source is a client.
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
    setLoading(true);

    getRecentActivities(orgId, 50)
      .then((data) => {
        if (isMounted) setActivities(data);
      })
      .catch((error) => {
        console.error("Failed to load recent activities:", error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [organizationId, authLoading]);

  const byChannel = (channel: string) =>
    activities
      .filter((a) => a.source.type === "lead" && a.metadata?.channel === channel)
      .slice(0, FEED_LIMIT);

  const studio = dedupeConversions(activities).slice(0, FEED_LIMIT);
  const website = byChannel("website");
  const instagram = byChannel("instagram");
  const clients = activities
    .filter((a) => a.source.type === "client")
    .slice(0, FEED_LIMIT);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <FeedCard
        title="Studio"
        activities={studio}
        currentUserId={uid ?? undefined}
        loading={loading}
        emptyLabel="No recent activity."
      />
      <FeedCard
        title="Website"
        activities={website}
        currentUserId={uid ?? undefined}
        loading={loading}
        emptyLabel="No website lead activity yet."
      />
      <FeedCard
        title="Instagram"
        activities={instagram}
        currentUserId={uid ?? undefined}
        loading={loading}
        emptyLabel="No Instagram lead activity yet."
      />
      <FeedCard
        title="Clients"
        activities={clients}
        currentUserId={uid ?? undefined}
        loading={loading}
        emptyLabel="No client activity yet."
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
