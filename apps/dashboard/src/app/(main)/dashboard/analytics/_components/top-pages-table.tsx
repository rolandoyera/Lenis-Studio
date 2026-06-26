"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { TanTable } from "@/components/ui/tan-table";
import type { TopPageItem } from "@/server/analytics-actions";

const columns: ColumnDef<TopPageItem>[] = [
  {
    accessorKey: "path",
    header: "Page",
    cell: ({ row }) => (
      <div className="truncate font-medium">{row.original.path}</div>
    ),
  },
  {
    accessorKey: "views",
    header: () => <div className="text-right">Views</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.views}</div>
    ),
  },
  {
    accessorKey: "time",
    header: () => <div className="text-right">Avg Time</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.time}
      </div>
    ),
  },
  {
    accessorKey: "bounce",
    header: () => <div className="text-right">Bounce</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.bounce}
      </div>
    ),
  },
];

export function TopPagesTable({ data }: { data: TopPageItem[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TanTable
      table={table}
      borderTop={false}
      emptyMessage="No page performance data available."
    />
  );
}
