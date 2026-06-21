import { TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchKpiData } from "@/server/analytics-actions";

import { AnalyticsSetupRequired } from "./analytics-setup-required";
import { Label } from "@/components/ui/label";

interface AnalyticsKpiStripProps {
  range?: string;
}

export async function AnalyticsKpiStrip({
  range = "last-24-hours",
}: AnalyticsKpiStripProps) {
  const result = await fetchKpiData(range);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        <AnalyticsSetupRequired
          error={result.error}
          title="Analytics KPI Error"
          className="min-h-[140px]"
        />
      </div>
    );
  }

  const {
    uniqueVisitors,
    visitors,
    pageviews,
    engagementRate,
    conversionRate,
  } = result.data;
  const labelText = result.comparisonLabel;

  const kpis = [
    { title: "Unique Visitors", metric: uniqueVisitors },
    { title: "Visitors", metric: visitors },
    { title: "Pageviews", metric: pageviews },
    { title: "Engagement Rate", metric: engagementRate },
    { title: "Conversion Rate", metric: conversionRate },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {kpis.map(({ title, metric }) => {
          const noChange = Number.parseFloat(metric.change) === 0;

          return (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="font-normal text-sm">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-2xl leading-none tracking-tight">
                    {metric.value}
                  </div>
                  {noChange ? (
                    <span className="text-muted-foreground text-xs">
                      No change
                    </span>
                  ) : (
                    <Badge
                      variant={metric.isPositive ? "success" : "destructive"}
                    >
                      {metric.isPositive ? <TrendingUp /> : <TrendingDown />}
                      {metric.change}
                    </Badge>
                  )}
                </div>
                <Label>
                  vs{" "}
                  <span className="text-base text-card-foreground">
                    {metric.previousValue}
                  </span>{" "}
                  {labelText}
                </Label>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
