import { HatchBarChart } from "@/components/charts/hatch-bar-chart";
import type { TrafficSourceItem } from "@/server/analytics-actions";

export function TrafficSourceBarChart({ data }: { data: TrafficSourceItem[] }) {
  return (
    <HatchBarChart
      data={data.map((item) => ({
        barText: item.source,
        value: item.visitors,
        valueLabel: item.label,
      }))}
      seriesLabel="Sessions"
    />
  );
}
