"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { TanTable } from "@/components/ui/tan-table";
import type {
  SearchPageItem,
  SearchQueryItem,
} from "@/server/search-console-actions";

// GSC returns full page URLs; show just the path so the table stays readable.
function toPath(url: string): string {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url;
  }
}

const queryColumns: ColumnDef<SearchQueryItem>[] = [
  {
    accessorKey: "query",
    header: "Query",
    cell: ({ row }) => (
      <div className="truncate font-medium">{row.original.query}</div>
    ),
  },
  {
    accessorKey: "clicks",
    header: () => <div className="text-right">Clicks</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.clicks}</div>
    ),
  },
  {
    accessorKey: "impressions",
    header: () => <div className="text-right">Impr.</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.impressions}
      </div>
    ),
  },
  {
    accessorKey: "ctr",
    header: () => <div className="text-right">CTR</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.ctr}
      </div>
    ),
  },
  {
    accessorKey: "position",
    header: () => <div className="text-right">Pos.</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.position}
      </div>
    ),
  },
];

const pageColumns: ColumnDef<SearchPageItem>[] = [
  {
    accessorKey: "page",
    header: "Page",
    cell: ({ row }) => (
      <div className="truncate font-medium">{toPath(row.original.page)}</div>
    ),
  },
  {
    accessorKey: "clicks",
    header: () => <div className="text-right">Clicks</div>,
    cell: ({ row }) => (
      <div className="text-right tabular-nums">{row.original.clicks}</div>
    ),
  },
  {
    accessorKey: "impressions",
    header: () => <div className="text-right">Impr.</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.impressions}
      </div>
    ),
  },
  {
    accessorKey: "ctr",
    header: () => <div className="text-right">CTR</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.ctr}
      </div>
    ),
  },
  {
    accessorKey: "position",
    header: () => <div className="text-right">Pos.</div>,
    cell: ({ row }) => (
      <div className="text-right text-muted-foreground tabular-nums">
        {row.original.position}
      </div>
    ),
  },
];

export function SearchQueriesTable({ data }: { data: SearchQueryItem[] }) {
  const table = useReactTable({
    data,
    columns: queryColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TanTable
      table={table}
      borderTop={false}
      emptyMessage="No query data available for this range."
    />
  );
}

export function SearchPagesTable({ data }: { data: SearchPageItem[] }) {
  const table = useReactTable({
    data,
    columns: pageColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TanTable
      table={table}
      borderTop={false}
      emptyMessage="No page data available for this range."
    />
  );
}
