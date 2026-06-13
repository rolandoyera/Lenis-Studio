import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fetchRealtimeData } from "@/server/analytics-actions";

import { AnalyticsSetupRequired } from "./analytics-setup-required";
import { RealtimeChart } from "./realtime-chart";

export async function RealtimeVisitors() {
  const result = await fetchRealtimeData();

  if (!result.success || !result.data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="font-normal">Realtime Visitors</CardTitle>
          <CardAction>
            <Ellipsis className="size-4" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <AnalyticsSetupRequired error={result.error} title="Realtime Visitors Error" className="h-64" />
        </CardContent>
      </Card>
    );
  }

  const { total, perMinute, countries } = result.data;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Realtime Visitors</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl tabular-nums leading-none tracking-tight">{total}</span>
            <span className="text-muted-foreground text-sm">in last 30 min</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span>Live</span>
          </div>
        </div>
        <RealtimeChart data={perMinute} />
        {countries.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground text-sm">
            No active visitors right now.
          </div>
        ) : (
          <div className="grid grid-cols-2">
            {countries.map((country, index) => (
              <div
                key={country.code || country.name}
                className={cn(
                  "flex items-center gap-3",
                  index % 2 === 0 ? "border-border/50 border-r pr-5" : "pl-5",
                  index < 2 ? "border-border/50 border-b pt-1 pb-4" : "pt-4 pb-1",
                )}
              >
                <span
                  aria-hidden="true"
                  className={`flag:${country.code} shrink-0 rounded-xs text-lg ring-1 ring-foreground/10`}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{country.name}</span>
                <span className="text-sm tabular-nums">{country.visitors}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
