import { Ellipsis } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchSearchTotals,
  fetchTopSearchPages,
  fetchTopSearchQueries,
} from "@/server/search-console-actions";

import { AnalyticsSetupRequired } from "./analytics-setup-required";

// GSC returns full page URLs; show just the path so the table stays readable.
function toPath(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

export async function GoogleSearchSection({ range }: { range?: string }) {
  const [totals, queries, pages] = await Promise.all([
    fetchSearchTotals(range),
    fetchTopSearchQueries(range),
    fetchTopSearchPages(range),
  ]);

  if (!totals.success && !queries.success && !pages.success) {
    return (
      <div className="rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        <AnalyticsSetupRequired
          error={totals.error}
          title="Search Console Error"
          className="min-h-[200px]"
        />
      </div>
    );
  }

  const kpis = [
    { label: "Total Clicks", value: totals.data?.clicks ?? "—" },
    { label: "Impressions", value: totals.data?.impressions ?? "—" },
    { label: "Average CTR", value: totals.data?.ctr ?? "—" },
    { label: "Average Position", value: totals.data?.position ?? "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="gap-2">
            <CardHeader>
              <CardTitle className="font-normal text-muted-foreground text-sm">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-semibold text-2xl tabular-nums">
                {kpi.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top queries */}
        <Card className="gap-2 pt-0">
          <CardHeader className="bg-muted/50 py-3">
            <CardTitle>Top Search Queries</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
              <TableHeader className="[&_tr]:border-border/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 font-normal">Query</TableHead>
                  <TableHead className="h-8 w-20 text-right font-normal">
                    Clicks
                  </TableHead>
                  <TableHead className="h-8 w-24 text-right font-normal">
                    Impr.
                  </TableHead>
                  <TableHead className="h-8 w-20 text-right font-normal">
                    CTR
                  </TableHead>
                  <TableHead className="h-8 w-20 text-right font-normal">
                    Pos.
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-border/50">
                {!queries.success ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-4">
                      <AnalyticsSetupRequired
                        error={queries.error}
                        title="Queries Error"
                        className="min-h-32"
                      />
                    </TableCell>
                  </TableRow>
                ) : queries.data.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="h-32 py-4 text-center text-muted-foreground text-sm">
                      No query data available for this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  queries.data.map((row) => (
                    <TableRow className="hover:bg-transparent" key={row.query}>
                      <TableCell className="max-w-0 truncate py-4 font-medium">
                        {row.query}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.clicks}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.impressions}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.ctr}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.position}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top pages */}
        <Card className="gap-2 pt-0">
          <CardHeader className="bg-muted/50 py-3">
            <CardTitle>Top Pages in Search</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
              <TableHeader className="[&_tr]:border-border/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 font-normal">Page</TableHead>
                  <TableHead className="h-8 w-20 text-right font-normal">
                    Clicks
                  </TableHead>
                  <TableHead className="h-8 w-24 text-right font-normal">
                    Impr.
                  </TableHead>
                  <TableHead className="h-8 w-20 text-right font-normal">
                    CTR
                  </TableHead>
                  <TableHead className="h-8 w-20 text-right font-normal">
                    Pos.
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-border/50">
                {!pages.success ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-4">
                      <AnalyticsSetupRequired
                        error={pages.error}
                        title="Pages Error"
                        className="min-h-32"
                      />
                    </TableCell>
                  </TableRow>
                ) : pages.data.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="h-32 py-4 text-center text-muted-foreground text-sm">
                      No page data available for this range.
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.data.map((row) => (
                    <TableRow className="hover:bg-transparent" key={row.page}>
                      <TableCell className="max-w-0 truncate py-4 font-medium">
                        {toPath(row.page)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.clicks}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.impressions}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.ctr}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {row.position}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
