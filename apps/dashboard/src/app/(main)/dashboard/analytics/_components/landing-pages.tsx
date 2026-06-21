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
import { fetchLandingPages } from "@/server/analytics-actions";

import { AnalyticsSetupRequired } from "./analytics-setup-required";

export async function LandingPages({ range }: { range?: string }) {
  const result = await fetchLandingPages(range);

  return (
    <Card className="h-full gap-2 pt-0">
      <CardHeader className="bg-muted/50 py-3">
        <CardTitle>Top Landing Pages</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 font-normal">Page</TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">
                Sessions
              </TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">
                Key Events
              </TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">
                Conv Rate
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {!result.success ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-4">
                  <AnalyticsSetupRequired
                    error={result.error}
                    title="Landing Pages Error"
                    className="min-h-32"
                  />
                </TableCell>
              </TableRow>
            ) : result.data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-32 py-4 text-center text-muted-foreground text-sm"
                >
                  No landing page data available.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((page) => (
                <TableRow className="hover:bg-transparent" key={page.path}>
                  <TableCell className="max-w-0 truncate py-4 font-medium">
                    {page.path}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {page.sessions}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {page.keyEvents}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {page.conversionRate}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
