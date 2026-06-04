"use client";

import { useCallback, useEffect, useState } from "react";

import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type GA4ConnectionResult, testGA4Connection } from "@/server/analytics-actions";

export function GA4ConnectionChecker() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<GA4ConnectionResult | null>(null);

  const checkConnection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await testGA4Connection();
      setResult(res);
    } catch (_e) {
      setResult({
        success: false,
        configMissing: false,
        error: "Failed to invoke connection test action.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {loading ? (
            <div className="mt-0.5 animate-duration-1000 animate-spin rounded-full bg-muted p-1 text-muted-foreground">
              <Loader2 className="size-4" />
            </div>
          ) : result?.success ? (
            <div className="mt-0.5 rounded-full bg-green-500/10 p-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
            </div>
          ) : (
            <div className="mt-0.5 rounded-full bg-amber-500/10 p-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4" />
            </div>
          )}

          <div>
            <h3 className="flex items-center gap-2 font-medium text-sm leading-none">
              GA4 Integration Status
              {!loading && (
                <span
                  className={`rounded-full px-1.5 py-0.5 font-bold text-[10px] uppercase tracking-wider ${
                    result?.success
                      ? "bg-green-500/10 text-green-700 dark:text-green-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {result?.success ? "Connected" : "Setup Required"}
                </span>
              )}
            </h3>

            <p className="mt-1.5 max-w-xl text-muted-foreground text-xs leading-normal">
              {loading && "Testing connection to Google Analytics 4 API..."}

              {!loading && result?.success && (
                <>
                  Successfully connected to the Google Analytics Data API! Found{" "}
                  <strong className="text-foreground">{result.activeUsers} active users</strong> in the last 7 days.
                </>
              )}

              {!loading && !result?.success && result?.configMissing && (
                <>
                  Credentials missing. Add{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">GA_PROPERTY_ID</code>,{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">GA_CLIENT_ID</code>,{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">GA_CLIENT_SECRET</code>, and{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">GA_REFRESH_TOKEN</code> inside
                  your <code className="font-semibold text-foreground">.env.local</code>.
                </>
              )}

              {!loading && !result?.success && !result?.configMissing && (
                <>
                  Connection failed: <span className="font-mono text-[11px] text-destructive">{result?.error}</span>.
                  Make sure your Google Account has read access to the specified Property ID.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={checkConnection} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
