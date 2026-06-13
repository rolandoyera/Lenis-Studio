"use client";

import { useCallback, useEffect, useState } from "react";

import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    void checkConnection();
  }, [checkConnection]);

  return (
    <Card className="p-4">
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

          <div className="flex flex-col gap-3">
            <h3 className="font-medium text-sm leading-none">Analytics Connection</h3>
            {!loading && (
              <Badge variant={result?.success ? "success" : "warning"} className={`w-fit`}>
                {result?.success ? "Connected" : "Setup Required"}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={checkConnection} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>
    </Card>
  );
}
