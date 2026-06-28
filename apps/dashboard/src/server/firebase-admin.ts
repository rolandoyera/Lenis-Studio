import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

/**
 * Parses FIREBASE_SERVICE_ACCOUNT_KEY, which may be the raw service-account
 * JSON or a base64-encoded version of it.
 */
function parseServiceAccountKey(raw: string): Record<string, string> {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{")
    ? trimmed
    : Buffer.from(trimmed, "base64").toString("utf8");
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
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_KEY in environment variables.",
    );
  }

  const serviceAccount = parseServiceAccountKey(serviceAccountKey);
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    // Default bucket for signed-PDF + raw-webhook-payload storage. Prefer an
    // explicit env override; otherwise derive from the service account project.
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${serviceAccount.project_id}.firebasestorage.app`,
  });
  return adminApp;
}

// settings() may be called only once per Firestore instance. In dev, Turbopack
// bundles server actions into separate module graphs that each get a fresh copy
// of `adminDb` (null) but share the same underlying Firestore singleton (keyed
// by the app). Track the "settings applied" flag on globalThis so it survives
// across those module instances and hot-reloads, preventing a double settings()
// call that would otherwise throw.
const settingsFlag = Symbol.for("crm.firebase-admin.settingsApplied");
const globalState = globalThis as typeof globalThis & {
  [settingsFlag]?: boolean;
};

/** Server-only Firestore client. Bypasses security rules — never expose to the client. */
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(getAdminApp());
  // Match the client SDK + cleanUndefined() behavior: omit undefined fields on
  // write instead of throwing. Must run before the instance is used elsewhere;
  // safe here because every caller goes through this cached accessor.
  if (!globalState[settingsFlag]) {
    adminDb.settings({ ignoreUndefinedProperties: true });
    globalState[settingsFlag] = true;
  }
  return adminDb;
}

/**
 * Server-only default Storage bucket — holds private contract artifacts (final
 * signed PDFs, raw Brevo webhook payloads). These objects are never made public;
 * clients reach the PDF only through a token-gated download route that streams it.
 */
export function getAdminBucket() {
  return getStorage(getAdminApp()).bucket();
}
