import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Parses FIREBASE_SERVICE_ACCOUNT_KEY, which may be the raw service-account
 * JSON or a base64-encoded version of it.
 */
function parseServiceAccountKey(raw: string): Record<string, string> {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, string>;
}

function getAdminApp(): App {
  if (adminApp) return adminApp;

  // Reuse an app initialized by a previous hot-reload pass.
  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY in environment variables.");
  }

  adminApp = initializeApp({
    credential: cert(parseServiceAccountKey(serviceAccountKey)),
  });
  return adminApp;
}

/** Server-only Firestore client. Bypasses security rules — never expose to the client. */
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp());
  return adminDb;
}
