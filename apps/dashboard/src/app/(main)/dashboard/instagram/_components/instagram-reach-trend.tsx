import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchInstagramReachTrend } from "@/server/meta-actions";

import { InstagramReachChart } from "./instagram-reach-chart";

export async function InstagramReachTrend({ range }: { range?: string }) {
  const result = await fetchInstagramReachTrend(range);

  if (!result.success || !result.data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Reach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground text-sm">
            {result.error ?? "Couldn't load reach."}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { points, comparison } = result.data;
  const hasData =
    points.length > 0 &&
    !points.every((p) => p.current === 0 && p.previous === 0);
  const noChange = Number.parseFloat(comparison.change) === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Reach</CardTitle>
        {hasData ? (
          <CardAction>
            {noChange ? (
              <span className="text-muted-foreground text-xs">No change</span>
            ) : (
              <Badge
                variant={comparison.isPositive ? "success" : "destructive"}
              >
                {comparison.isPositive ? <TrendingUp /> : <TrendingDown />}
                {comparison.change}
              </Badge>
            )}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!hasData ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1 text-center text-muted-foreground text-sm">
            No reach recorded in this range yet.
          </div>
        ) : (
          <InstagramReachChart data={points} />
        )}
      </CardContent>
    </Card>
  );
}
