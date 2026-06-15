import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInstagramDemographics } from "@/server/meta-actions";
import type { DemographicItem } from "@/server/meta-graph";

import { type DemoBar, InstagramDemoBarChart } from "./instagram-demo-bar-chart";

const AGE_ORDER = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const GENDER_LABELS: Record<string, string> = { M: "Men", F: "Women", U: "Unknown" };

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function toBars(items: DemographicItem[]): DemoBar[] {
  return items.map((i) => ({ key: i.label, label: i.label, value: i.value, valueLabel: String(i.value) }));
}

function DemoCard({ title, data }: { title: string; data: DemoBar[] }) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <InstagramDemoBarChart data={data} />
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
  if (cities.length === 0 && countries.length === 0 && age.length === 0 && gender.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground text-sm">
        Audience demographics need at least 100 followers to show.
      </Card>
    );
  }

  const cityBars = toBars(cities.slice(0, 6));
  // Country: code stays inside the bar, full name shows in the hover popup.
  const countryBars: DemoBar[] = countries.slice(0, 6).map((c) => ({
    key: c.label,
    label: countryName(c.label),
    value: c.value,
    valueLabel: String(c.value),
  }));
  const ageBars = toBars([...age].sort((a, b) => AGE_ORDER.indexOf(a.label) - AGE_ORDER.indexOf(b.label)).slice(0, 6));
  const genderBars = toBars(gender.map((g) => ({ ...g, label: GENDER_LABELS[g.label] ?? g.label })));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DemoCard title="Top Cities" data={cityBars} />
      <DemoCard title="Top Countries" data={countryBars} />
      <DemoCard title="Age" data={ageBars} />
      <DemoCard title="Gender" data={genderBars} />
    </div>
  );
}
