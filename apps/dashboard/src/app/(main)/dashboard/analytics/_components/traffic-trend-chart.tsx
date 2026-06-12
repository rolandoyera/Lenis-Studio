"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { TrendPoint } from "@/server/analytics-actions";

const chartConfig = {
  activeUsers: {
    color: "var(--chart-1)",
    label: "Visitors",
  },
  sessions: {
    color: "var(--chart-3)",
    label: "Sessions",
  },
} satisfies ChartConfig;

export function TrafficTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart accessibilityLayer data={data} margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.4} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
        <YAxis tickLine={false} axisLine={false} tickMargin={4} width={32} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="sessions"
          type="monotone"
          fill="var(--color-sessions)"
          fillOpacity={0.1}
          stroke="var(--color-sessions)"
          strokeWidth={2}
        />
        <Area
          dataKey="activeUsers"
          type="monotone"
          fill="var(--color-activeUsers)"
          fillOpacity={0.15}
          stroke="var(--color-activeUsers)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
