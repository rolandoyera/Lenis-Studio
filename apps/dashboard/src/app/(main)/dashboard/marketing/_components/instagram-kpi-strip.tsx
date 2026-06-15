import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInstagramKpis } from "@/server/meta-actions";

function formatCount(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toString();
}

export async function InstagramKpiStrip({ range }: { range?: string }) {
  const result = await fetchInstagramKpis(range);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl bg-card p-6 text-center text-muted-foreground text-sm shadow-xs ring-1 ring-foreground/10">
        {result.error ?? "Couldn't load Instagram metrics."}
      </div>
    );
  }

  const { reach, views, profileViews, accountsEngaged } = result.data;
  const kpis = [
    { title: "Accounts Reached", value: reach, hint: "Unique accounts that saw your content" },
    { title: "Views", value: views, hint: "Times your content was shown" },
    { title: "Profile Visits", value: profileViews, hint: "Times your profile was visited" },
    { title: "Accounts Engaged", value: accountsEngaged, hint: "Accounts that interacted" },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
        {kpis.map(({ title, value, hint }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="font-normal text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="text-2xl leading-none tracking-tight">{formatCount(value)}</div>
              <p className="text-muted-foreground text-xs">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
