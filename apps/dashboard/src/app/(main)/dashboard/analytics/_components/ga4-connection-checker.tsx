"use client";

import { useEffect, useState } from "react";

import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type GA4ConnectionResult, testGA4Connection } from "@/server/analytics-actions";

export function GA4ConnectionChecker() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<GA4ConnectionResult | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const res = await testGA4Connection();
      setResult(res);
    } catch (e) {
      setResult({
        success: false,
        configMissing: false,
        error: "Failed to invoke connection test action.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {loading ? (
            <div className="mt-0.5 rounded-full p-1 bg-muted text-muted-foreground animate-spin animate-duration-1000">
              <Loader2 className="size-4" />
            </div>
          ) : result?.success ? (
            <div className="mt-0.5 rounded-full p-1 bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2 className="size-4" />
            </div>
          ) : (
            <div className="mt-0.5 rounded-full p-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4" />
            </div>
          )}

          <div>
            <h3 className="font-medium text-sm leading-none flex items-center gap-2">
              GA4 Integration Status
              {!loading && (
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${
                    result?.success
                      ? "bg-green-500/10 text-green-700 dark:text-green-300"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {result?.success ? "Connected" : "Setup Required"}
                </span>
              )}
            </h3>

            <p className="text-muted-foreground text-xs mt-1.5 leading-normal max-w-xl">
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
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">GA_PROPERTY_ID</code>,{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">GA_CLIENT_ID</code>,{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">GA_CLIENT_SECRET</code>, and{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">GA_REFRESH_TOKEN</code> inside
                  your <code className="font-semibold text-foreground">.env.local</code>.
                </>
              )}

              {!loading && !result?.success && !result?.configMissing && (
                <>
                  Connection failed: <span className="text-destructive font-mono text-[11px]">{result?.error}</span>.
                  Make sure your Google Account has read access to the specified Property ID.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={checkConnection} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
