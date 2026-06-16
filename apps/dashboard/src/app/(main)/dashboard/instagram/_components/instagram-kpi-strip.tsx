import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { fetchInstagramKpis } from "@/server/meta-actions";

function formatCount(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toString();
}

export async function InstagramKpiStrip({ range }: { range?: string }) {
  const result = await fetchInstagramKpis(range);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl bg-card p-6 text-center text-muted-foreground text-sm shadow-xs ring-1 ring-foreground/10">
        {result.error ?? "Couldn't load Instagram metrics."}
      </div>
    );
  }

  const { reach, views, profileViews, accountsEngaged, comparisonLabel } = result.data;
  const kpis = [
    { title: "Accounts Reached", metric: reach },
    { title: "Views", metric: views },
    { title: "Profile Visits", metric: profileViews },
    { title: "Accounts Engaged", metric: accountsEngaged },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {kpis.map(({ title, metric }) => {
          const noChange = Number.parseFloat(metric.change) === 0;

          return (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="font-normal text-sm">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl leading-none tracking-tight">{formatCount(metric.value)}</div>
                  {noChange ? (
                    <span className="text-muted-foreground text-xs">No change</span>
                  ) : (
                    <Badge
                      className={
                        metric.isPositive
                          ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                          : "bg-destructive/10 text-destructive"
                      }
                    >
                      {metric.isPositive ? <TrendingUp /> : <TrendingDown />}
                      {metric.change}
                    </Badge>
                  )}
                </div>
                <Label>
                  vs <span className="text-base text-card-foreground">{formatCount(metric.previousValue)}</span>{" "}
                  {comparisonLabel}
                </Label>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
