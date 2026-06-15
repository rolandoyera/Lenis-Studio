import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInstagramReachTrend } from "@/server/meta-actions";

import { InstagramReachChart } from "./instagram-reach-chart";

export async function InstagramReachTrend({ range }: { range?: string }) {
  const result = await fetchInstagramReachTrend(range);
  const allZero = result.success && result.data.every((p) => p.reach === 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Reach</CardTitle>
      </CardHeader>
      <CardContent>
        {!result.success ? (
          <div className="flex h-64 items-center justify-center text-center text-muted-foreground text-sm">
            {result.error ?? "Couldn't load reach."}
          </div>
        ) : result.data.length === 0 || allZero ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1 text-center text-muted-foreground text-sm">
            No reach recorded in this range yet.
          </div>
        ) : (
          <InstagramReachChart data={result.data} />
        )}
      </CardContent>
    </Card>
  );
}
