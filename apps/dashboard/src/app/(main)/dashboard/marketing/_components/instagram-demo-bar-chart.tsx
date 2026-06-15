"use client";

import { Bar, BarChart, CartesianGrid, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export interface DemoBar {
  /** Short text shown inside the bar (e.g. a country code). */
  key: string;
  /** Tooltip label (e.g. the full country name). Same as `key` when no expansion. */
  label: string;
  value: number;
  valueLabel: string;
}

const chartConfig = {
  value: {
    color: "var(--chart-1)",
    label: "Followers",
  },
} satisfies ChartConfig;

export function InstagramDemoBarChart({ data }: { data: DemoBar[] }) {
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
    return <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">No data yet.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 0, right: 48 }}>
        <CartesianGrid horizontal={false} vertical={false} />
        {/* YAxis category drives the tooltip's top label — full name for countries. */}
        <YAxis dataKey="label" hide tickLine={false} tickMargin={10} type="category" />
        <XAxis dataKey="value" hide type="number" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar barSize={40} dataKey="value" fill="var(--color-value)" fillOpacity={0.5} radius={8}>
          <LabelList className="fill-foreground" dataKey="key" fontSize={14} offset={12} position="insideLeft" />
          <LabelList content={renderValueLabel} dataKey="valueLabel" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
