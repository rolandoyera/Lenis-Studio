import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAudienceData } from "@/server/analytics-actions";

import { AnalyticsSetupRequired } from "./analytics-setup-required";
import { Label } from "@/components/ui/label";

function ShareBarList({
  items,
}: {
  items: { label: string; users: number; flagCode?: string }[];
}) {
  const total = items.reduce((sum, item) => sum + item.users, 0);

  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
        No data available for this range.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const pct = total > 0 ? (item.users / total) * 100 : 0;

        return (
          <div key={item.label} className="flex flex-col gap-2">
            <div className="flex h-5 items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                {item.flagCode && (
                  <span
                    aria-hidden="true"
                    className={`flag:${item.flagCode} shrink-0 rounded-xs text-base ring-1 ring-foreground/10`}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {item.users}
                <span className="ml-2 text-muted-foreground text-xs">
                  ({pct.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  smarttv: "Smart TV",
};

const VISITOR_TYPE_LABELS: Record<string, string> = {
  new: "New visitors",
  returning: "Returning visitors",
};

export async function AudienceSection({ range }: { range?: string }) {
  const result = await fetchAudienceData(range);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        <AnalyticsSetupRequired
          error={result.error}
          title="Audience Error"
          className="min-h-[200px]"
        />
      </div>
    );
  }

  const { cities, countries, devices, newVsReturning } = result.data;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
      <Card className="col-span-1 lg:col-span-6">
        <CardHeader>
          <CardTitle className="font-normal">Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="ml-auto w-fit mb-4 -mt-4">Users</Label>
          <ShareBarList
            items={devices.map((device) => ({
              label: DEVICE_LABELS[device.device] || device.device,
              users: device.users,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="col-span-1 lg:col-span-6">
        <CardHeader>
          <CardTitle className="font-normal">New vs Returning</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="ml-auto w-fit mb-4 -mt-4">Users</Label>
          <ShareBarList
            items={newVsReturning.map((entry) => ({
              label: VISITOR_TYPE_LABELS[entry.type] || entry.type,
              users: entry.users,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-1 lg:col-span-6">
        <CardHeader>
          <CardTitle className="font-normal">Top Cities</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="ml-auto w-fit mb-4 -mt-4">Users</Label>
          <ShareBarList
            items={cities.map((city) => ({
              label: city.city,
              users: city.users,
              flagCode: city.countryId || undefined,
            }))}
          />
        </CardContent>
      </Card>
      <Card className="md:col-span-1 lg:col-span-6">
        <CardHeader>
          <CardTitle className="font-normal">Top Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="ml-auto w-fit mb-4 -mt-4">Users</Label>
          <ShareBarList
            items={countries.map((country) => ({
              label: country.country,
              users: country.users,
              flagCode: country.countryId || undefined,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
