"use client";
"use no memo";

import * as React from "react";

import Link from "next/link";

import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDownIcon,
  ListFilter,
  Pencil,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { selectionColumn, TanTable } from "@/components/ui/tan-table";
import type { ContractStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

import { ContractStatusBadge } from "../../../contracts/_components/contract-status-badge";

/** Mock contract row mirroring the Contracts list table while we iterate here. */
interface ContractRow {
  id: string;
  title: string;
  clientName: string;
  projectName: string;
  durationMonths: string;
  retainer: number;
  status: ContractStatus;
  updatedByName: string;
  updatedAt: number;
}

const DAY = 86_400_000;

const contractRows: ContractRow[] = [
  {
    id: "c1",
    title: "Design Services Agreement",
    clientName: "Jordan Avery",
    projectName: "Riverside Loft",
    durationMonths: "6",
    retainer: 12000,
    status: "draft",
    updatedByName: "You",
    updatedAt: Date.now() - 2 * DAY,
  },
  {
    id: "c2",
    title: "Full-Service Interior Design",
    clientName: "Casey Lin",
    projectName: "Hillcrest Residence",
    durationMonths: "9",
    retainer: 24500,
    status: "sent",
    updatedByName: "Morgan Reed",
    updatedAt: Date.now() - 5 * DAY,
  },
  {
    id: "c3",
    title: "Kitchen Renovation Contract",
    clientName: "Taylor Brooks",
    projectName: "Maple Court",
    durationMonths: "4",
    retainer: 8000,
    status: "viewed",
    updatedByName: "Morgan Reed",
    updatedAt: Date.now() - 7 * DAY,
  },
  {
    id: "c4",
    title: "Design Services Agreement",
    clientName: "Riley Park",
    projectName: "Lakeshore Penthouse",
    durationMonths: "12",
    retainer: 38000,
    status: "signed",
    updatedByName: "You",
    updatedAt: Date.now() - 9 * DAY,
  },
  {
    id: "c5",
    title: "Staging & Styling Agreement",
    clientName: "Avery Collins",
    projectName: "Downtown Studio",
    durationMonths: "2",
    retainer: 4500,
    status: "void",
    updatedByName: "Sam Ellis",
    updatedAt: Date.now() - 14 * DAY,
  },
  {
    id: "c6",
    title: "Full-Service Interior Design",
    clientName: "Quinn Foster",
    projectName: "Birchwood Estate",
    durationMonths: "10",
    retainer: 29000,
    status: "sent",
    updatedByName: "Sam Ellis",
    updatedAt: Date.now() - 16 * DAY,
  },
  {
    id: "c7",
    title: "Design Services Agreement",
    clientName: "Drew Mercer",
    projectName: "Cedar Heights",
    durationMonths: "5",
    retainer: 15000,
    status: "draft",
    updatedByName: "You",
    updatedAt: Date.now() - 18 * DAY,
  },
  {
    id: "c8",
    title: "Bathroom Remodel Contract",
    clientName: "Skyler Reyes",
    projectName: "Garden Apartments",
    durationMonths: "3",
    retainer: 6800,
    status: "viewed",
    updatedByName: "Morgan Reed",
    updatedAt: Date.now() - 21 * DAY,
  },
  {
    id: "c9",
    title: "Full-Service Interior Design",
    clientName: "Harper Quinn",
    projectName: "Summit View",
    durationMonths: "8",
    retainer: 21500,
    status: "signed",
    updatedByName: "Sam Ellis",
    updatedAt: Date.now() - 24 * DAY,
  },
  {
    id: "c10",
    title: "Design Services Agreement",
    clientName: "Rowan Bishop",
    projectName: "Oakmont Villa",
    durationMonths: "7",
    retainer: 19000,
    status: "sent",
    updatedByName: "You",
    updatedAt: Date.now() - 27 * DAY,
  },
  {
    id: "c11",
    title: "Styling Agreement",
    clientName: "Emerson Wade",
    projectName: "Harborfront Condo",
    durationMonths: "2",
    retainer: 5200,
    status: "draft",
    updatedByName: "Morgan Reed",
    updatedAt: Date.now() - 30 * DAY,
  },
  {
    id: "c12",
    title: "Full-Service Interior Design",
    clientName: "Finley Hayes",
    projectName: "Westgate Townhome",
    durationMonths: "11",
    retainer: 32000,
    status: "signed",
    updatedByName: "Sam Ellis",
    updatedAt: Date.now() - 34 * DAY,
  },
];

const statusOptions = [
  "all",
  "draft",
  "sent",
  "viewed",
  "signed",
  "void",
] as const;

/** "Jun 18, 2026" from an epoch-ms timestamp. */
function formatUpdated(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** A clickable column header that toggles sorting with an up/down arrow icon. */
function SortableHeader({
  column,
  children,
  align = "left",
}: {
  column: Column<ContractRow, unknown>;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "-mx-3 h-8 gap-1.5 px-3 font-medium text-foreground text-sm hover:bg-transparent",
        align === "right" && "flex-row-reverse",
      )}
    >
      {children}
      <Icon
        className={cn(
          "size-3.5",
          sorted ? "text-foreground" : "text-muted-foreground/60",
        )}
      />
    </Button>
  );
}

const contractColumns: ColumnDef<ContractRow>[] = [
  selectionColumn<ContractRow>(),
  {
    accessorKey: "title",
    header: ({ column }) => (
      <SortableHeader column={column}>Contract</SortableHeader>
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/contracts/${row.original.id}`}
        className="font-medium text-foreground text-sm hover:underline"
      >
        {row.original.title}
      </Link>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => (
      <SortableHeader column={column}>Client</SortableHeader>
    ),
    cell: ({ row }) => <div className="text-sm">{row.original.clientName}</div>,
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <SortableHeader column={column}>Project</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.original.projectName}</div>
    ),
  },
  {
    accessorKey: "durationMonths",
    header: ({ column }) => (
      <SortableHeader column={column}>Duration</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.original.durationMonths} months</div>
    ),
    // Sort numerically — "12" should rank above "2", not below it alphabetically.
    sortingFn: (a, b) =>
      Number(a.original.durationMonths) - Number(b.original.durationMonths),
  },
  {
    accessorKey: "retainer",
    header: ({ column }) => (
      <SortableHeader column={column}>Retainer</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm text-foreground/80">
        {formatCurrency(row.original.retainer, { noDecimals: true })}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <ContractStatusBadge status={row.original.status} />,
    filterFn: "equalsString",
  },
  {
    accessorKey: "updatedByName",
    header: ({ column }) => (
      <SortableHeader column={column}>Updated by</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.original.updatedByName}</div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <div className="flex justify-end">
        <SortableHeader column={column} align="right">
          Updated
        </SortableHeader>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right text-sm">
        {formatUpdated(row.original.updatedAt)}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Action</div>,
    cell: () => (
      <div className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground hover:bg-transparent focus-visible:bg-transparent"
        >
          <Pencil />
          <span className="sr-only">Edit contract</span>
        </Button>
      </div>
    ),
    enableHiding: false,
  },
];

export function TablesPlayground() {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility] = React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data: contractRows,
    columns: contractColumns,
    state: {
      rowSelection,
      columnFilters,
      columnVisibility,
      sorting,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });
  const searchQuery = table.getState().globalFilter ?? "";
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string) ?? "all";

  return (
    <section className="mt-4">
      <Card variant="panel" className="gap-0">
        <CardHeader className="h-17!">
          <CardTitle className="leading-none">Recent Contracts</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              className="w-44 md:w-52"
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(event) => {
                table.setGlobalFilter(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ListFilter data-icon="inline-start" />
                  Status
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuRadioGroup
                  value={statusFilter}
                  onValueChange={(value) => {
                    table
                      .getColumn("status")
                      ?.setFilterValue(value === "all" ? undefined : value);
                    table.setPageIndex(0);
                  }}
                >
                  {statusOptions.map((option) => (
                    <DropdownMenuRadioItem key={option} value={option}>
                      {option === "all"
                        ? "All statuses"
                        : option.charAt(0).toUpperCase() + option.slice(1)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="flex items-center gap-2">
              <Plus className="size-4" />
              Add Contract
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0 pt-0">
          <TanTable table={table} pagination noun="contracts" />
        </CardContent>
      </Card>
    </section>
  );
}
