"use client";
"use no memo";

import { type ReactNode, useEffect, useState } from "react";

import Link from "next/link";

import type { Column, ColumnDef, SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FileText,
  Loader2,
  SquarePen,
  Plus,
} from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { ContractStatusBadge } from "@/app/(main)/dashboard/contracts/_components/contract-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TanTable } from "@/components/ui/tan-table";
import {
  getOrganizationUsers,
  getProjectContracts,
  getProjectDocuments,
} from "@/lib/db";
import type { Contract, ContractStatus, ProjectDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectFilesCardProps {
  projectId: string;
  organizationId: string;
}

const TYPE_LABELS: Record<ProjectDocument["type"], string> = {
  contract: "Contract",
};

/**
 * A unified row for the Files tab. `file` rows are finalized documents stored in
 * `projectDocuments` (executed contracts, invoices, …) and are downloadable.
 * `draft` rows are in-progress contracts that have not yet executed into a stored
 * file — they link to the contract builder instead of a download.
 */
type FileRow =
  | {
      kind: "file";
      key: string;
      title: string;
      code?: string;
      typeLabel: string;
      status?: ContractStatus;
      createdAt: number;
      createdBy: string;
      fileUrl: string;
    }
  | {
      kind: "draft";
      key: string;
      title: string;
      code?: string;
      typeLabel: string;
      status: ContractStatus;
      createdAt: number;
      createdBy: string;
      contractId: string;
    };

function buildRows(
  documents: ProjectDocument[],
  contracts: Contract[],
): FileRow[] {
  // A contract that already has a stored document is shown as that file, not also
  // as a draft — de-dupe by the contract id the document was produced from.
  const finalizedContractIds = new Set(
    documents
      .map((d) => d.contractId)
      .filter((id): id is string => Boolean(id)),
  );
  const contractById = new Map(contracts.map((c) => [c.contractId, c]));

  const fileRows: FileRow[] = documents.map((d) => {
    const contract = d.contractId ? contractById.get(d.contractId) : undefined;
    return {
      kind: "file",
      key: d.documentId,
      title: d.title,
      code: contract?.contractCode,
      typeLabel: TYPE_LABELS[d.type],
      status: contract?.status,
      createdAt: d.createdAt,
      createdBy: d.createdBy,
      fileUrl: d.fileUrl,
    };
  });

  const draftRows: FileRow[] = contracts
    .filter((c) => !finalizedContractIds.has(c.contractId))
    .map((c) => ({
      kind: "draft",
      key: `contract-${c.contractId}`,
      title: c.title,
      code: c.contractCode,
      typeLabel: "Contract",
      status: c.status,
      createdAt: c.createdAt,
      createdBy: c.createdBy,
      contractId: c.contractId,
    }));

  return [...fileRows, ...draftRows];
}

/** "Jun 18, 2026" from an epoch-ms timestamp. */
function formatAdded(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SortableHeader({
  column,
  children,
  align = "left",
}: {
  column: Column<FileRow, unknown>;
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
      )}>
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

function buildColumns(
  createdByLabel: (row: FileRow) => string,
): ColumnDef<FileRow>[] {
  return [
    {
      accessorKey: "typeLabel",
      header: ({ column }) => (
        <SortableHeader column={column}>Type</SortableHeader>
      ),
      cell: ({ row }) => <Badge>{row.original.typeLabel}</Badge>,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <SortableHeader column={column}>Document</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="font-medium font-serif text-foreground">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableHeader column={column}>Reference</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.code ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex h-5 items-center">
          {row.original.status ? (
            <ContractStatusBadge status={row.original.status} />
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Added</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatAdded(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "createdBy",
      header: ({ column }) => (
        <SortableHeader column={column}>Created By</SortableHeader>
      ),
      accessorFn: (row) => createdByLabel(row),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {createdByLabel(row.original)}
        </span>
      ),
    },
    {
      id: "action",
      header: () => "Actions",
      cell: ({ row }) =>
        row.original.kind === "file" ? (
          <Button asChild size="sm" variant="secondary">
            <a href={row.original.fileUrl}>
              <Download className="size-3" />
              Download
            </a>
          </Button>
        ) : (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/dashboard/contracts/${row.original.contractId}`}>
              <SquarePen className="size-3" />
              Open
            </Link>
          </Button>
        ),
      enableSorting: false,
    },
  ];
}

export function ProjectFilesCard({
  projectId,
  organizationId,
}: ProjectFilesCardProps) {
  const { uid } = useAuth();
  const [rows, setRows] = useState<FileRow[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void (async () => {
      const [docs, contracts, users] = await Promise.all([
        getProjectDocuments(organizationId, projectId),
        getProjectContracts(organizationId, projectId),
        getOrganizationUsers(organizationId),
      ]);
      if (!active) return;
      setRows(buildRows(docs, contracts));
      setUserNames(Object.fromEntries(users.map((u) => [u.uid, u.fullName])));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [organizationId, projectId]);

  // Auto-generated docs are stamped "system"; otherwise resolve the UID to a
  // name, showing "You" for the signed-in user.
  const createdByLabel = (row: FileRow): string => {
    if (row.createdBy === "system") return "System";
    if (row.createdBy === uid) return "You";
    return userNames[row.createdBy] ?? "—";
  };

  const columns = buildColumns(createdByLabel);

  // A "draft" row is a contract that exists but hasn't executed into a stored
  // document yet (draft/sent/viewed all stay drafts until execution). Hide the
  // "+ Contract" action while one is still open — finish it before starting another.
  const hasUnexecutedContract = rows.some((row) => row.kind === "draft");

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    getRowId: (row) => row.key,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card variant="panel" className="col-span-12">
      <CardHeader>
        <CardTitle>
          <FileText className="icons" />
          Project Files
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 text-sm">
        {loading ? (
          <div className="flex items-center justify-center px-4 py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <TanTable
            table={table}
            noun="files"
            emptyMessage="No files yet."
            borderTop={false}
          />
        )}
      </CardContent>
      <CardFooter className="justify-end h-14 gap-4">
        <Button size="sm" variant="secondary">
          <Plus className="size-3" />
          Proposal
        </Button>
        <Button size="sm" variant="secondary">
          <Plus className="size-3" />
          Invoice
        </Button>
        {!hasUnexecutedContract && (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/dashboard/contracts/new?projectId=${projectId}`}>
              <Plus className="size-3" />
              Contract
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
