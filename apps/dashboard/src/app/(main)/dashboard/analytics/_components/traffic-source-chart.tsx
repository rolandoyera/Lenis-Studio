"use client";

import { Bar, BarChart, CartesianGrid, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { TrafficSourceItem } from "@/server/analytics-actions";

const chartConfig = {
  visitors: {
    color: "var(--chart-1)",
    label: "Sessions",
  },
} satisfies ChartConfig;

export function TrafficSourceBarChart({ data }: { data: TrafficSourceItem[] }) {
  const renderValueLabel = (props: LabelProps) => {
    const { height, value, y } = props;

    return (
      <text
        className="fill-foreground"
        dominantBaseline="middle"
        dx={-6}
        fontSize={14}
        textAnchor="end"
        x="100%"
        y={Number(y) + Number(height) / 2}
      >
        {value}
      </text>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">No data for this range.</div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 0,
          right: 48,
        }}
      >
        <CartesianGrid horizontal={false} vertical={false} />
        <YAxis dataKey="source" hide tickLine={false} tickMargin={10} type="category" />
        <XAxis dataKey="visitors" hide type="number" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar barSize={40} dataKey="visitors" fill="var(--color-visitors)" fillOpacity={0.5} radius={8}>
          <LabelList className="fill-foreground" dataKey="source" fontSize={14} offset={12} position="insideLeft" />
          <LabelList content={renderValueLabel} dataKey="label" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
