"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { IgTrendPoint } from "@/server/meta-graph";

const chartConfig = {
  reach: {
    color: "var(--chart-1)",
    label: "Reach",
  },
} satisfies ChartConfig;

export function InstagramReachChart({ data }: { data: IgTrendPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <AreaChart accessibilityLayer data={data} margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.4} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
        <YAxis tickLine={false} axisLine={false} tickMargin={4} width={32} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="reach"
          type="monotone"
          fill="var(--color-reach)"
          fillOpacity={0.15}
          stroke="var(--color-reach)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
