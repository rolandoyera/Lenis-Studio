import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTrafficTrend } from "@/server/analytics-actions";

import { AnalyticsErrorToast } from "./analytics-error-toast";
import { TrafficTrendChart } from "./traffic-trend-chart";

export async function TrafficTrend({ range }: { range?: string }) {
  const result = await fetchTrafficTrend(range);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Traffic Trend</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {!result.success || result.data.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1 text-center text-muted-foreground text-sm">
            <AnalyticsErrorToast error={result.error} title="Traffic Trend Error" />
            {result.error || "No traffic data available for this range."}
          </div>
        ) : (
          <TrafficTrendChart data={result.data} />
        )}
      </CardContent>
    </Card>
  );
}
