"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { TanTable } from "@/components/ui/tan-table";
import type { ChannelRow, SourceMediumRow } from "@/server/analytics-actions";

const channelColumns: ColumnDef<ChannelRow>[] = [
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.channel}</div>
    ),
  },
  {
    accessorKey: "sessions",
    header: () => <div className="text-right">Sessions</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.sessions}</div>
    ),
  },
  {
    accessorKey: "users",
    header: () => <div className="text-right">Users</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.users}
      </div>
    ),
  },
  {
    accessorKey: "engagementRate",
    header: () => <div className="text-right">Engagement</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.engagementRate}
      </div>
    ),
  },
  {
    accessorKey: "keyEvents",
    header: () => <div className="text-right">Key Events</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.keyEvents}</div>
    ),
  },
];

const sourceMediumColumns: ColumnDef<SourceMediumRow>[] = [
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <div className="truncate font-medium">{row.original.source}</div>
    ),
  },
  {
    accessorKey: "medium",
    header: "Medium",
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.original.medium}</div>
    ),
  },
  {
    accessorKey: "sessions",
    header: () => <div className="text-right">Sessions</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.sessions}</div>
    ),
  },
  {
    accessorKey: "keyEvents",
    header: () => <div className="text-right">Key Events</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.keyEvents}</div>
    ),
  },
];

export function ChannelsTable({ data }: { data: ChannelRow[] }) {
  const table = useReactTable({
    data,
    columns: channelColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TanTable
      table={table}
      borderTop={false}
      emptyMessage="No channel data available for this range."
    />
  );
}

export function SourceMediumTable({ data }: { data: SourceMediumRow[] }) {
  const table = useReactTable({
    data,
    columns: sourceMediumColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TanTable
      table={table}
      borderTop={false}
      emptyMessage="No source/medium data available for this range."
    />
  );
}
