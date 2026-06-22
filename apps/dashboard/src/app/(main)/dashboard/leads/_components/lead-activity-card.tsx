"use client";

import { Activity as ActivityIcon } from "lucide-react";

import { ActivityFeed } from "@/app/(main)/dashboard/_components/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity } from "@/lib/types";

interface LeadActivityCardProps {
  activities: Activity[];
  /** Signed-in user's uid — their own actions render as "You". */
  currentUserId?: string;
}

/**
 * Read-only, newest-first timeline of a lead's sales/relationship activity from
 * the flat `activities` collection (filtered to this lead). Append-only: this
 * card never mutates records.
 */
export function LeadActivityCard({
  activities,
  currentUserId,
}: LeadActivityCardProps) {
  return (
    <Card className="pt-0">
      <CardHeader className="py-3 bg-muted/50">
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="size-4" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        <ActivityFeed
          activities={activities}
          currentUserId={currentUserId}
          emptyLabel="No activity logged yet for this lead."
        />
      </CardContent>
    </Card>
  );
}
