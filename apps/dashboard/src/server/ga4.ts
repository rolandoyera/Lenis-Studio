import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { GoogleAuth } from "google-auth-library";

let gaClient: BetaAnalyticsDataClient | null = null;

export function getGA4Client() {
  if (gaClient) return gaClient;

  const clientId = process.env.GA_CLIENT_ID;
  const clientSecret = process.env.GA_CLIENT_SECRET;
  const refreshToken = process.env.GA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GA_CLIENT_ID, GA_CLIENT_SECRET, or GA_REFRESH_TOKEN in environment variables.");
  }

  const auth = new GoogleAuth({
    credentials: {
      type: "authorized_user",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
  });

  gaClient = new BetaAnalyticsDataClient({
    auth: auth,
  });

  return gaClient;
}
