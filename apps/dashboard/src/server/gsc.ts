import { GoogleAuth } from "google-auth-library";
import { google, type searchconsole_v1 } from "googleapis";

let gscClient: searchconsole_v1.Searchconsole | null = null;

/**
 * Parses GA_SERVICE_ACCOUNT_KEY, which may be the raw service-account JSON
 * or a base64-encoded version of it (easier to paste into env managers).
 */
function parseServiceAccountKey(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, unknown>;
}

export function hasGSCCredentials(): boolean {
  return Boolean(process.env.GSC_SERVICE_ACCOUNT_KEY || process.env.GA_SERVICE_ACCOUNT_KEY);
}

function buildAuth(): GoogleAuth {
  // Reuse the GA service account by default; allow a dedicated key if set.
  // The SA email must be added under Search Console > Settings > Users and permissions.
  const serviceAccountKey = process.env.GSC_SERVICE_ACCOUNT_KEY || process.env.GA_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error("Missing GSC_SERVICE_ACCOUNT_KEY (or GA_SERVICE_ACCOUNT_KEY) for Search Console access.");
  }

  return new GoogleAuth({
    credentials: parseServiceAccountKey(serviceAccountKey),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export function getGSCClient(): searchconsole_v1.Searchconsole {
  if (gscClient) return gscClient;

  gscClient = google.searchconsole({ version: "v1", auth: buildAuth() });
  return gscClient;
}
