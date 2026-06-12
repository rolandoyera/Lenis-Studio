import { ArrowDownRight, ArrowUpRight, Ellipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchKpiData } from "@/server/analytics-actions";

import { AnalyticsErrorToast } from "./analytics-error-toast";

interface AnalyticsKpiStripProps {
  range?: string;
}

export async function AnalyticsKpiStrip({ range = "last-24-hours" }: AnalyticsKpiStripProps) {
  const result = await fetchKpiData(range);

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card p-8 text-center text-muted-foreground ring-1 ring-foreground/10">
        <AnalyticsErrorToast error={result.error} title="Analytics KPI Error" />
        <span className="font-semibold text-foreground text-sm">Failed to load live metrics</span>
        <span className="max-w-md text-muted-foreground text-xs">
          {result.error || "Please check your Google Analytics configuration settings."}
        </span>
      </div>
    );
  }

  const { uniqueVisitors, visitors, pageviews, engagementRate, conversionRate } = result.data;
  const labelText = result.comparisonLabel;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {/* Card 1: Unique Visitors */}
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Unique Visitors</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{uniqueVisitors.value}</div>
              <Badge
                className={
                  uniqueVisitors.isPositive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {uniqueVisitors.isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
                {uniqueVisitors.change}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                vs. <span className="text-foreground">{uniqueVisitors.previousValue}</span>
              </span>
              <span>•</span>
              <span>{labelText}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Visitors */}
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Visitors</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{visitors.value}</div>
              <Badge
                className={
                  visitors.isPositive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {visitors.isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
                {visitors.change}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                vs. <span className="text-foreground">{visitors.previousValue}</span>
              </span>
              <span>•</span>
              <span>{labelText}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pageviews */}
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Pageviews</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{pageviews.value}</div>
              <Badge
                className={
                  pageviews.isPositive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {pageviews.isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
                {pageviews.change}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                vs. <span className="text-foreground">{pageviews.previousValue}</span>
              </span>
              <span>•</span>
              <span>{labelText}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Engagement Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Engagement Rate</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{engagementRate.value}</div>
              <Badge
                className={
                  engagementRate.isPositive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {engagementRate.isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
                {engagementRate.change}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                vs. <span className="text-foreground">{engagementRate.previousValue}</span>
              </span>
              <span>•</span>
              <span>{labelText}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Conversion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Conversion Rate</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{conversionRate.value}</div>
              <Badge
                className={
                  conversionRate.isPositive
                    ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                    : "bg-destructive/10 text-destructive"
                }
              >
                {conversionRate.isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
                {conversionRate.change}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                vs. <span className="text-foreground">{conversionRate.previousValue}</span>
              </span>
              <span>•</span>
              <span>{labelText}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
