import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";

let gaClient: BetaAnalyticsDataClient | null = null;

/**
 * Parses GA_SERVICE_ACCOUNT_KEY, which may be the raw service-account JSON
 * or a base64-encoded version of it (easier to paste into env managers).
 */
function parseServiceAccountKey(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const json = trimmed.startsWith("{") ? trimmed : Buffer.from(trimmed, "base64").toString("utf8");
  return JSON.parse(json) as Record<string, unknown>;
}

export function hasGA4Credentials(): boolean {
  if (process.env.GA_SERVICE_ACCOUNT_KEY) return true;

  const clientId = process.env.GA_CLIENT_ID;
  const clientSecret = process.env.GA_CLIENT_SECRET;
  const refreshToken = process.env.GA_REFRESH_TOKEN;
  return Boolean(clientId && clientSecret && refreshToken && refreshToken !== "PASTE_YOUR_REFRESH_TOKEN_HERE");
}

function buildAuth(): GoogleAuth {
  const serviceAccountKey = process.env.GA_SERVICE_ACCOUNT_KEY;

  // Preferred: service account (no token expiry; clients grant it Viewer access in GA4).
  if (serviceAccountKey) {
    return new GoogleAuth({
      credentials: parseServiceAccountKey(serviceAccountKey),
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });
  }

  // Legacy fallback: personal OAuth refresh token.
  const clientId = process.env.GA_CLIENT_ID;
  const clientSecret = process.env.GA_CLIENT_SECRET;
  const refreshToken = process.env.GA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GA_SERVICE_ACCOUNT_KEY (or legacy GA_CLIENT_ID/GA_CLIENT_SECRET/GA_REFRESH_TOKEN).");
  }

  return new GoogleAuth({
    credentials: {
      type: "authorized_user",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
  });
}

export function getGA4Client() {
  if (gaClient) return gaClient;

  gaClient = new BetaAnalyticsDataClient({
    auth: buildAuth(),
  });

  return gaClient;
}
