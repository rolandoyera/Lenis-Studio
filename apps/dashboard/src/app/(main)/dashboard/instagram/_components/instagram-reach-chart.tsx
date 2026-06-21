"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ReachTrendPoint } from "@/server/meta-actions";

const chartConfig = {
  current: {
    color: "var(--chart-1)",
    label: "Current",
  },
  previous: {
    color: "var(--chart-3)",
    label: "Previous",
  },
} satisfies ChartConfig;

export function InstagramReachChart({ data }: { data: ReachTrendPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ bottom: 0, left: 0, right: 12, top: 8 }}
      >
        <CartesianGrid vertical={false} strokeOpacity={0.4} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              className="gap-2 px-3.5 py-3"
              formatter={(value, name, item) => {
                const key = name as keyof typeof chartConfig;
                const point = item.payload as ReachTrendPoint;
                const date =
                  key === "previous" ? point.previousLabel : point.label;
                return (
                  <div className="flex flex-1 items-center gap-2">
                    <div
                      className="h-2.5 w-1 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                      <span className="text-muted-foreground">
                        {chartConfig[key].label} · {date}
                      </span>
                      <span className="font-medium font-mono text-foreground tabular-nums">
                        {Number(value).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
          }
        />
        <Area
          dataKey="previous"
          type="monotone"
          fill="var(--color-previous)"
          fillOpacity={0.1}
          stroke="var(--color-previous)"
          strokeWidth={2}
        />
        <Area
          dataKey="current"
          type="monotone"
          fill="var(--color-current)"
          fillOpacity={0.15}
          stroke="var(--color-current)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
