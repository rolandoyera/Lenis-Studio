"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ConversionsData } from "@/server/analytics-actions";

const chartConfig = {
  keyEvents: {
    color: "var(--chart-1)",
    label: "Key events",
  },
} satisfies ChartConfig;

export function KeyEventsChart({ data }: { data: ConversionsData["trend"] }) {
  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart accessibilityLayer data={data} margin={{ bottom: 0, left: 0, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.4} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
        <YAxis tickLine={false} axisLine={false} tickMargin={4} width={32} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="keyEvents" fill="var(--color-keyEvents)" fillOpacity={0.7} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
