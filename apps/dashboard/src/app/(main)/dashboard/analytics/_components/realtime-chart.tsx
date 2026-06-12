"use client";

import { Bar, BarChart, type BarShapeProps, XAxis, YAxis } from "recharts";

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { RealtimeData } from "@/server/analytics-actions";

const chartConfig = {
  visitors: {
    color: "var(--chart-3)",
    label: "Visitors",
  },
} satisfies ChartConfig;

function RealtimeBarShape(props: BarShapeProps) {
  const { height, payload, width, x, y } = props;
  const barPayload = payload as RealtimeData["perMinute"][number] | undefined;
  const barHeightValue = Number(height);
  const barWidthValue = Number(width);
  const xValue = Number(x);
  const yValue = Number(y);
  const visitors = barPayload?.visitors ?? 0;
  const fill = "var(--color-visitors)";
  const fillOpacity = visitors >= 18 ? 0.95 : 0.4;
  const baselineFill = visitors === 0 ? "var(--destructive)" : fill;
  const baselineOpacity = visitors === 0 ? 1 : fillOpacity;
  const baselineY = yValue + barHeightValue - 2;
  const barGap = 4;
  const barHeight = Math.max(0, barHeightValue - barGap);

  return (
    <g>
      <rect
        x={xValue}
        y={baselineY}
        width={barWidthValue}
        height={2}
        rx={1}
        fill={baselineFill}
        fillOpacity={baselineOpacity}
      />
      {visitors > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={fill}
          fillOpacity={fillOpacity}
        />
      ) : null}
    </g>
  );
}

export function RealtimeChart({ data }: { data: RealtimeData["perMinute"] }) {
  const maxVisitors = Math.max(...data.map((d) => d.visitors), 1);

  return (
    <ChartContainer config={chartConfig} className="h-36 w-full">
      <BarChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 0 }} barCategoryGap={3}>
        <XAxis dataKey="minute" hide />
        <YAxis hide domain={[0, maxVisitors + 2]} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="visitors" fill="var(--color-visitors)" shape={RealtimeBarShape} />
      </BarChart>
    </ChartContainer>
  );
}
