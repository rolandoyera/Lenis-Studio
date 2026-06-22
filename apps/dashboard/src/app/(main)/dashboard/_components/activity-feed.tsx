"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Activity as ActivityIcon,
  ArrowRightLeft,
  GitCommitHorizontal,
  MessageSquarePlus,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";

import type { Activity, ActivityType } from "@/lib/types";

type ActivityIconType = React.ComponentType<{ className?: string }>;

/**
 * Per-event icon + label. Partial on purpose: only the events we actually emit
 * get bespoke treatment; anything else (future comms/document events) falls back
 * to a generic entry so the feed never breaks on an unknown type.
 */
const ACTIVITY_META: Partial<
  Record<ActivityType, { icon: ActivityIconType; label: string }>
> = {
  client_created: { icon: Sparkles, label: "Client created" },
  lead_created: { icon: Sparkles, label: "Lead created" },
  lead_stage_changed: { icon: GitCommitHorizontal, label: "Stage changed" },
  lead_assigned: { icon: UserPlus, label: "Assigned" },
  lead_unassigned: { icon: UserMinus, label: "Unassigned" },
  lead_lost: { icon: XCircle, label: "Marked lost" },
  lead_converted_to_client: {
    icon: ArrowRightLeft,
    label: "Converted to client",
  },
  note_added: { icon: MessageSquarePlus, label: "Note added" },
  note_deleted: { icon: Trash2, label: "Note deleted" },
};

const FALLBACK = { icon: ActivityIcon, label: "Activity" };

interface ActivityFeedProps {
  activities: Activity[];
  /** Signed-in user's uid — their own actions render as "You". */
  currentUserId?: string;
  /** Shown when there are no activities. */
  emptyLabel?: string;
  /**
   * When true, each row's primary line includes the source label (e.g. the
   * lead/client name). Used by the org-wide dashboard feed where rows mix
   * entities; per-entity timelines leave it off since the subject is implied.
   */
  showSource?: boolean;
}

/**
 * Read-only, newest-first list of activity rows. Presentational only — the
 * caller fetches and filters; this just renders. Shared by the per-entity
 * timeline cards and the home dashboard feed.
 */
export function ActivityFeed({
  activities,
  currentUserId,
  emptyLabel = "No activity yet.",
  showSource = false,
}: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground text-xs italic">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {activities.map((activity) => (
        <ActivityRow
          key={activity.id}
          activity={activity}
          currentUserId={currentUserId}
          showSource={showSource}
        />
      ))}
    </ul>
  );
}

function ActivityRow({
  activity,
  currentUserId,
  showSource,
}: {
  activity: Activity;
  currentUserId?: string;
  showSource: boolean;
}) {
  const meta = ACTIVITY_META[activity.type] ?? FALLBACK;
  const Icon = meta.icon;
  // In the org feed, lead the detail with the subject (source label); on a
  // per-entity timeline, conversions still surface the record they point at.
  const detail = showSource
    ? activity.source.label
    : activity.type === "lead_converted_to_client"
      ? activity.entity.label
      : undefined;
  // Self-attribution reads as "You"; the stored name is left untouched.
  const actorName =
    currentUserId && activity.actor.id === currentUserId
      ? "You"
      : activity.actor.name;

  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <Icon className="size-3.5" />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-card-foreground text-sm">
          {meta.label}
          {detail && (
            <span className="font-normal text-muted-foreground"> · {detail}</span>
          )}
        </p>
        <p className="text-muted-foreground text-xs">
          {actorName} ·{" "}
          {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
        </p>
      </div>
    </li>
  );
}
