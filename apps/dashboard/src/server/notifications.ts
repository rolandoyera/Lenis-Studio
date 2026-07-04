// Server-only producer for in-app notifications (top-level `notifications`
// collection — see AppNotification in @/lib/types). One doc per event, fan-out
// on read; clients never create these (admin SDK bypasses rules). The oshrat
// marketing repo writes `lead_created` docs with the same shape inline (no
// shared package — synced manually).

import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "./firebase-admin";

import type { AppNotification } from "@/lib/types";

const NOTIFICATIONS_COLLECTION = "notifications";

/** How long a notification lives before Firestore TTL hard-deletes it. */
const NOTIFICATION_TTL_DAYS = 60;

export type AppNotificationInput = Omit<
  AppNotification,
  "notificationId" | "readBy" | "dismissedBy" | "expireAt"
>;

/** Strip `undefined`s — firebase-admin rejects them, and payloads are sparse. */
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Write one notification doc. Callers wrap this in try/catch — a notification
 * failure must never break the flow that produced it (lead intake, signing).
 */
export async function writeNotification(
  input: AppNotificationInput,
): Promise<string> {
  const ref = getAdminDb().collection(NOTIFICATIONS_COLLECTION).doc();
  await ref.set({
    ...clean({
      ...input,
      notificationId: ref.id,
      readBy: [],
      dismissedBy: [],
    }),
    // TTL needs a real Timestamp, so it's attached after clean() (the JSON
    // round-trip would destroy it).
    expireAt: Timestamp.fromMillis(
      input.createdAt + NOTIFICATION_TTL_DAYS * 86_400_000,
    ),
  });
  return ref.id;
}
