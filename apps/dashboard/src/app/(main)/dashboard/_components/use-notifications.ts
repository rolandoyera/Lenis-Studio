"use client";

import { useEffect, useState } from "react";

import { collection, onSnapshot, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { AppNotification } from "@/lib/types";

/** How many notifications consumers keep in memory / render. */
export const NOTIFICATIONS_LIMIT = 30;

/**
 * Live notifications for the signed-in user: the org-wide feed plus anything
 * targeted at them. Keyed on the stable organizationId/uid primitives from
 * useAuth — never the profile object (its identity churns each heartbeat).
 */
export function useNotifications(
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
          list
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, NOTIFICATIONS_LIMIT),
        );
      },
      (error) => console.error("Failed to load notifications:", error),
    );
    return unsubscribe;
  }, [organizationId, uid, authLoading]);

  return notifications;
}
