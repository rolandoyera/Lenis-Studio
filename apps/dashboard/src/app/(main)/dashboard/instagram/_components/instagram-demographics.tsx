import {
  HatchBarChart,
  type HatchBarDatum,
} from "@/components/charts/hatch-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H3 } from "@/components/ui/typography";
import { fetchInstagramDemographics } from "@/server/meta-actions";
import type { DemographicItem } from "@/server/meta-graph";

const AGE_ORDER = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const GENDER_LABELS: Record<string, string> = {
  M: "Men",
  F: "Women",
  U: "Unknown",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function toBars(items: DemographicItem[]): HatchBarDatum[] {
  return items.map((i) => ({
    barText: i.label,
    value: i.value,
    valueLabel: String(i.value),
  }));
}

function DemoCard({ title, data }: { title: string; data: HatchBarDatum[] }) {
  return (
    <Card className="h-full gap-2 pt-0">
      <CardHeader className="bg-muted/50 py-3">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <HatchBarChart data={data} seriesLabel="Followers" showPercentage />
      </CardContent>
    </Card>
  );
}

export async function InstagramDemographics() {
  const result = await fetchInstagramDemographics();

  if (!result.success || !result.data) {
    return (
      <Card className="p-6 text-center text-muted-foreground text-sm">
        {result.error ?? "Couldn't load demographics."}
      </Card>
    );
  }

  const { cities, countries, age, gender } = result.data;

  // Everything empty usually means the account is under Meta's 100-follower minimum.
  if (
    cities.length === 0 &&
    countries.length === 0 &&
    age.length === 0 &&
    gender.length === 0
  ) {
    return (
      <Card className="p-6 text-center text-muted-foreground text-sm">
        Audience demographics need at least 100 followers to show.
      </Card>
    );
  }

  const cityBars = toBars(cities.slice(0, 6));
  // Country: flag in the gutter, full name inside the bar.
  const countryBars: HatchBarDatum[] = countries.slice(0, 6).map((c) => ({
    barText: countryName(c.label),
    value: c.value,
    valueLabel: String(c.value),
    flagCode: c.label || undefined,
  }));
  const ageBars = toBars(
    [...age]
      .sort((a, b) => AGE_ORDER.indexOf(a.label) - AGE_ORDER.indexOf(b.label))
      .slice(0, 6),
  );
  const genderBars = toBars(
    gender.map((g) => ({ ...g, label: GENDER_LABELS[g.label] ?? g.label })),
  );

  return (
    <>
      <H3 className="mb-6 font-normal">Followers</H3>
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        <DemoCard title="Top Cities" data={cityBars} />
        <DemoCard title="Top Countries" data={countryBars} />
        <DemoCard title="Age" data={ageBars} />
        <DemoCard title="Gender" data={genderBars} />
      </div>
    </>
  );
}
