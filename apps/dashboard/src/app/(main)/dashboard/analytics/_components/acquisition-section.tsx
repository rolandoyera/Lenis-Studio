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
import { fetchAcquisitionData } from "@/server/analytics-actions";

import { AnalyticsSetupRequired } from "./analytics-setup-required";

export async function AcquisitionSection({ range }: { range?: string }) {
  const result = await fetchAcquisitionData(range);

  if (!result.success || !result.data) {
    return (
      <div className="rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
        <AnalyticsSetupRequired
          error={result.error}
          title="Acquisition Error"
          className="min-h-[200px]"
        />
      </div>
    );
  }

  const { channels, sourceMedium } = result.data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="gap-2 pt-0">
        <CardHeader className="bg-muted/50 py-3">
          <CardTitle>Channels</CardTitle>
          <CardAction>
            <Ellipsis className="size-4" />
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
            <TableHeader className="[&_tr]:border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 font-normal">Channel</TableHead>
                <TableHead className="h-8 w-20 text-right font-normal">
                  Sessions
                </TableHead>
                <TableHead className="h-8 w-20 text-right font-normal">
                  Users
                </TableHead>
                <TableHead className="h-8 w-24 text-right font-normal">
                  Engagement
                </TableHead>
                <TableHead className="h-8 w-24 text-right font-normal">
                  Key Events
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-border/50">
              {channels.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="h-32 py-4 text-center text-muted-foreground text-sm"
                  >
                    No channel data available for this range.
                  </TableCell>
                </TableRow>
              ) : (
                channels.map((row) => (
                  <TableRow className="hover:bg-transparent" key={row.channel}>
                    <TableCell className="py-4 font-medium">
                      {row.channel}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.sessions}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {row.users}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {row.engagementRate}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.keyEvents}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="gap-2 pt-0">
        <CardHeader className="bg-muted/50 py-3">
          <CardTitle>Source / Medium</CardTitle>
          <CardAction>
            <Ellipsis className="size-4" />
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
            <TableHeader className="[&_tr]:border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-8 font-normal">Source</TableHead>
                <TableHead className="h-8 font-normal">Medium</TableHead>
                <TableHead className="h-8 w-20 text-right font-normal">
                  Sessions
                </TableHead>
                <TableHead className="h-8 w-24 text-right font-normal">
                  Key Events
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="[&_tr]:border-border/50">
              {sourceMedium.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="h-32 py-4 text-center text-muted-foreground text-sm"
                  >
                    No source/medium data available for this range.
                  </TableCell>
                </TableRow>
              ) : (
                sourceMedium.map((row) => (
                  <TableRow
                    className="hover:bg-transparent"
                    key={`${row.source}/${row.medium}`}
                  >
                    <TableCell className="max-w-0 truncate py-4 font-medium">
                      {row.source}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.medium}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.sessions}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.keyEvents}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
