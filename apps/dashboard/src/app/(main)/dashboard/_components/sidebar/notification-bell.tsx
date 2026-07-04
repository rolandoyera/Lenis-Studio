"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { formatDistanceToNow } from "date-fns";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Bell, Check, ExternalLink, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dismissNotification, markNotificationRead } from "@/lib/db";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

/** How many notifications the bell keeps in memory / renders. */
const BELL_LIMIT = 30;

/**
 * Live notifications for the signed-in user: the org-wide feed plus anything
 * targeted at them. Keyed on the stable organizationId/uid primitives from
 * useAuth — never the profile object (its identity churns each heartbeat).
 */
function useNotifications(
  organizationId: string | null,
  uid: string | null,
  authLoading: boolean,
) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (authLoading || !organizationId || !uid) return;
    // The audience clause is required by firestore.rules (list queries must be
    // provably in scope), not just a filter. Sort in memory — no composite index.
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("organizationId", "==", organizationId),
      where("audience", "in", ["org", uid]),
    );
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as AppNotification);
        setNotifications(
          list.sort((a, b) => b.createdAt - a.createdAt).slice(0, BELL_LIMIT),
        );
      },
      (error) => console.error("Failed to load notifications:", error),
    );
    return unsubscribe;
  }, [organizationId, uid, authLoading]);

  return notifications;
}

export function NotificationBell() {
  const { organizationId, uid, loading: authLoading } = useAuth();
  const notifications = useNotifications(organizationId, uid, authLoading);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!uid) return null;

  const visible = notifications.filter((n) => !n.dismissedBy.includes(uid));
  const unreadCount = visible.filter((n) => !n.readBy.includes(uid)).length;

  const handleView = (n: AppNotification) => {
    if (!n.readBy.includes(uid))
      void markNotificationRead(n.notificationId, uid);
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <h4 className="font-medium text-sm leading-none">Notifications</h4>
        </div>
        {visible.length === 0 ? (
          <p className="px-4 py-6 text-center text-muted-foreground text-sm">
            You're all caught up.
          </p>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="flex flex-col divide-y">
              {visible.map((n) => {
                const unread = !n.readBy.includes(uid);
                return (
                  <div key={n.notificationId} className="flex gap-2 px-4 py-3">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        unread ? "bg-primary" : "bg-transparent",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p
                        className={cn(
                          "text-sm",
                          unread
                            ? "font-medium"
                            : "font-normal text-muted-foreground",
                        )}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="truncate text-muted-foreground text-xs">
                          {n.body}
                        </p>
                      )}
                      <p className="text-muted-foreground/70 text-xs">
                        {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-start gap-0.5">
                      {unread && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Mark as read"
                          title="Mark as read"
                          onClick={() =>
                            void markNotificationRead(n.notificationId, uid)
                          }
                        >
                          <Check />
                        </Button>
                      )}
                      {n.href && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="View"
                          title="View"
                          onClick={() => handleView(n)}
                        >
                          <ExternalLink />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Delete"
                        title="Delete"
                        onClick={() =>
                          void dismissNotification(n.notificationId, uid)
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
