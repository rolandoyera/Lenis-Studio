"use client";
"use no memo";

import { type ReactNode, useEffect, useState } from "react";

import Link from "next/link";

import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDownIcon,
  Eye,
  ListFilter,
  Loader2,
  Plus,
} from "lucide-react";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import PageHeader from "@/components/page-header";
import { PageTitle } from "@/components/page-title-updater";
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
import { TanTable } from "@/components/ui/tan-table";
import { getContracts, getOrganizationUsers } from "@/lib/db";
import type { Contract, ContractStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

import { ContractStatusBadge } from "./_components/contract-status-badge";

/** "Jun 18, 2026" from an epoch-ms timestamp. */
function formatUpdated(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Project duration in months (a raw text value), e.g. "6 months". */
function durationLabel(contract: Contract): string {
  const raw = contract.values.PROJECT_DURATION_MONTHS?.trim();
  return raw ? `${raw} months` : "—";
}

/** The contract's headline figure is the initial retainer (a raw number string). */
function retainerLabel(contract: Contract): string {
  const raw = contract.values.RETAINER_FEE;
  const amount = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(amount)
    ? formatCurrency(amount, { noDecimals: true })
    : "—";
}

const statusOptions = [
  "all",
  "draft",
  "sent",
  "viewed",
  "signed",
  "void",
] as const satisfies readonly ("all" | ContractStatus)[];

function SortableHeader({
  column,
  children,
  align = "left",
}: {
  column: Column<Contract, unknown>;
  children: ReactNode;
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

export default function ContractsPage() {
  const { organizationId, uid, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dep; profile identity churns

    async function loadContracts() {
      try {
        const [list, users] = await Promise.all([
          getContracts(orgId),
          getOrganizationUsers(orgId),
        ]);
        setContracts(list);
        setUserNames(Object.fromEntries(users.map((u) => [u.uid, u.fullName])));
      } catch (error) {
        console.error("Failed to load contracts:", error);
        toast.error("Failed to fetch contracts from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadContracts();
  }, [organizationId, authLoading]);

  /** Resolve a contract's editor UID to a name, showing "You" for the signed-in user. */
  const updatedByLabel = (contract: Contract): string => {
    if (contract.updatedBy === uid) return "You";
    return userNames[contract.updatedBy] ?? "—";
  };

  const columns: ColumnDef<Contract>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <SortableHeader column={column}>Contract</SortableHeader>
      ),
      cell: ({ row }) => (
        <Link
          href={`/dashboard/contracts/${row.original.contractId}`}
          className="font-medium text-foreground text-sm hover:text-primary hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "clientName",
      header: ({ column }) => (
        <SortableHeader column={column}>Client</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="text-sm">{row.original.clientName}</div>
      ),
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
      id: "duration",
      header: ({ column }) => (
        <SortableHeader column={column}>Duration</SortableHeader>
      ),
      accessorFn: (contract) => {
        const raw = contract.values.PROJECT_DURATION_MONTHS?.trim();
        return raw ? Number(raw) : Number.NaN;
      },
      cell: ({ row }) => (
        <div className="text-sm">{durationLabel(row.original)}</div>
      ),
      sortingFn: (a, b) => {
        const aValue = Number(a.getValue("duration"));
        const bValue = Number(b.getValue("duration"));

        if (!Number.isFinite(aValue) && !Number.isFinite(bValue)) return 0;
        if (!Number.isFinite(aValue)) return 1;
        if (!Number.isFinite(bValue)) return -1;
        return aValue - bValue;
      },
    },
    {
      id: "retainer",
      header: ({ column }) => (
        <SortableHeader column={column}>Retainer</SortableHeader>
      ),
      accessorFn: (contract) => {
        const amount = Number(contract.values.RETAINER_FEE);
        return Number.isFinite(amount) ? amount : Number.NaN;
      },
      cell: ({ row }) => (
        <div className="font-mono text-sm text-foreground/80">
          {retainerLabel(row.original)}
        </div>
      ),
      sortingFn: (a, b) => {
        const aValue = Number(a.getValue("retainer"));
        const bValue = Number(b.getValue("retainer"));

        if (!Number.isFinite(aValue) && !Number.isFinite(bValue)) return 0;
        if (!Number.isFinite(aValue)) return 1;
        if (!Number.isFinite(bValue)) return -1;
        return aValue - bValue;
      },
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
      id: "updatedByName",
      header: ({ column }) => (
        <SortableHeader column={column}>Updated by</SortableHeader>
      ),
      accessorFn: updatedByLabel,
      cell: ({ row }) => (
        <div className="text-sm">{updatedByLabel(row.original)}</div>
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
      id: "view",
      header: () => <div className="text-right">View</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href={`/dashboard/contracts/${row.original.contractId}`}>
              <Eye />
              <span className="sr-only">View contract</span>
            </Link>
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const table = useReactTable({
    data: contracts,
    columns,
    state: {
      columnFilters,
      sorting,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.contractId,
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
    <>
      <PageTitle title="Contracts" />
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Contracts"
            description="Draft, send, and track client design agreements."
          />
        </div>

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
              <Button asChild>
                <Link href="/dashboard/contracts/new">
                  <Plus className="size-4" />
                  Contract
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-0 pt-0">
            {loading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : (
              <TanTable
                table={table}
                pagination
                noun="contracts"
                emptyMessage="No contracts yet. Create your first one to get started."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
