"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { ChartLine } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { PageTitle } from "@/components/page-title-updater";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { H1 } from "@/components/ui/typography";
import {
  type FirestoreUsage,
  type UsageRange,
  getFirestoreUsage,
} from "@/server/monitoring-actions";

import { UsageChartCard } from "./_components/usage-chart-card";

const RANGE_OPTIONS: { value: UsageRange; label: string; ms: number }[] = [
  { value: "60m", label: "Last 60 minutes", ms: 60 * 60_000 },
  { value: "24h", label: "Last 24 hours", ms: 24 * 3_600_000 },
  { value: "7d", label: "Last 7 days", ms: 7 * 86_400_000 },
  { value: "30d", label: "Last 30 days", ms: 30 * 86_400_000 },
];

const REFRESH_MS = 60_000;

function bucketLabel(bucketSeconds: number): string {
  if (bucketSeconds === 60) return "per minute";
  if (bucketSeconds < 3_600) return `per ${bucketSeconds / 60} minutes`;
  return `per ${bucketSeconds / 3_600} hours`;
}

export default function UsagePage() {
  const { uid, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [range, setRange] = useState<UsageRange>("60m");
  const [usage, setUsage] = useState<FirestoreUsage | null>(null);

  // Access check & redirect
  useEffect(() => {
    if (authLoading) return;
    if (!uid) {
      router.push("/auth/login");
      return;
    }
    if (role !== "SuperAdmin") {
      toast.error("Access denied. SuperAdmin privileges required.");
      router.push("/dashboard/home");
    }
  }, [uid, role, authLoading, router]);

  // Load + auto-refresh while the tab is visible. The server action caches per
  // range for 60s, so refreshes and extra viewers share one upstream call.
  useEffect(() => {
    if (authLoading || role !== "SuperAdmin") return;

    let cancelled = false;
    const load = async () => {
      try {
        const data = await getFirestoreUsage(range);
        if (!cancelled) setUsage(data);
      } catch (error) {
        console.error("Failed to load usage metrics:", error);
        if (!cancelled) toast.error("Failed to load usage metrics.");
      }
    };

    void load();
    const interval = setInterval(() => {
      if (!document.hidden) void load();
    }, REFRESH_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [range, role, authLoading]);

  if (authLoading || role !== "SuperAdmin") {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <div className="relative size-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="animate-pulse font-medium text-muted-foreground text-xs uppercase tracking-widest">
            Verifying Authority
          </p>
        </div>
      </div>
    );
  }

  // Stale data from the previous range renders as loading, not as mislabeled charts.
  const loading = !usage || usage.range !== range;
  const rangeMs = RANGE_OPTIONS.find((o) => o.value === range)?.ms ?? 0;
  const opsCaption = usage ? bucketLabel(usage.bucketSeconds) : "";

  return (
    <>
      <PageTitle title="Usage" />
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <H1 className="flex items-center gap-2">
              <ChartLine className="size-8 text-primary" />
              Usage
            </H1>
            <p className="text-muted-foreground text-sm">
              Firestore activity across the whole project (all tenants). Metrics
              arrive with a ~4 minute delay.
            </p>
          </div>
          <Select
            value={range}
            onValueChange={(value) => setRange(value as UsageRange)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <UsageChartCard
          title="Billable metrics"
          caption={`Operations (${opsCaption})`}
          totalMode="sum"
          rangeMs={rangeMs}
          loading={loading}
          data={usage?.operations ?? []}
          series={[
            { key: "reads", label: "Reads", color: "var(--chart-1)" },
            { key: "writes", label: "Writes", color: "var(--chart-2)" },
            { key: "deletes", label: "Deletes", color: "var(--chart-3)" },
          ]}
        />
        <UsageChartCard
          title="Subscription metrics"
          caption={`Peak subscriptions (${opsCaption})`}
          totalMode="peak"
          rangeMs={rangeMs}
          loading={loading}
          data={usage?.subscriptions ?? []}
          series={[
            {
              key: "listeners",
              label: "Snapshot listeners",
              color: "var(--chart-1)",
            },
            {
              key: "connections",
              label: "Active connections",
              color: "var(--chart-2)",
            },
          ]}
        />
        <UsageChartCard
          title="Rules metrics"
          caption={`Rules evaluations (${opsCaption})`}
          totalMode="sum"
          rangeMs={rangeMs}
          loading={loading}
          data={usage?.rules ?? []}
          series={[
            { key: "allows", label: "Allows", color: "var(--chart-1)" },
            { key: "denies", label: "Denies", color: "var(--chart-2)" },
            { key: "errors", label: "Errors", color: "var(--chart-3)" },
          ]}
        />
      </div>
    </>
  );
}
