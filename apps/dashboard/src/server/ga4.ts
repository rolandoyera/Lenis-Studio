import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";

let gaClient: BetaAnalyticsDataClient | null = null;

// GA4's Data API caps concurrent requests per property. One analytics render
// fans out ~19 reports across all tab sections, and dev Fast Refresh re-fires
// that whole burst on every save — overlapping renders blow the quota
// (RESOURCE_EXHAUSTED). Funnel every report through one process-wide limiter so
// at most a handful are ever in flight; excess calls queue instead of failing.
const MAX_CONCURRENT_GA4_REQUESTS = 5;

function createLimiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (active >= max || queue.length === 0) return;
    active++;
    const run = queue.shift();
    run?.();
  };

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        } finally {
          active--;
          next();
        }
      });
      next();
    });
  };
}

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

  const client = new BetaAnalyticsDataClient({
    auth: buildAuth(),
  });

  // Route both report methods through a shared limiter so every GA4 Data API
  // call — regardless of which action issues it — respects the concurrency cap.
  const limit = createLimiter(MAX_CONCURRENT_GA4_REQUESTS);
  const runReport = client.runReport.bind(client) as (...args: unknown[]) => Promise<unknown>;
  const runRealtimeReport = client.runRealtimeReport.bind(client) as (...args: unknown[]) => Promise<unknown>;
  client.runReport = ((...args: unknown[]) => limit(() => runReport(...args))) as typeof client.runReport;
  client.runRealtimeReport = ((...args: unknown[]) =>
    limit(() => runRealtimeReport(...args))) as typeof client.runRealtimeReport;

  gaClient = client;
  return gaClient;
}
