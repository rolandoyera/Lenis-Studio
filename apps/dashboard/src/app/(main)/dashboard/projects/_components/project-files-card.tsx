"use client";
"use no memo";

import { type ReactNode, useEffect, useMemo, useState } from "react";

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
  MoreVertical,
  Send,
  SquarePen,
  Plus,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { ContractStatusChain } from "@/app/(main)/dashboard/contracts/_components/contract-status-chain";
import { useResendSigningLink } from "@/app/(main)/dashboard/contracts/_components/use-resend-signing-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  TooltipDropdownMenu,
} from "@/components/ui/dropdown-menu";
import { TanTable } from "@/components/ui/tan-table";
import { getOrganizationUsers } from "@/lib/db";
import { db } from "@/lib/firebase";
import type { Contract, ContractStatus, ProjectDocument } from "@/lib/types";
import { canResendContract } from "@/lib/contract-resend";
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
      /** The contract this file was produced from, if any — drives the status chain. */
      contract?: Contract;
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
      /** The in-progress contract — drives the realtime status chain. */
      contract: Contract;
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
      code: d.contractCode,
      typeLabel: TYPE_LABELS[d.type],
      status: contract?.status,
      contract,
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
      contract: c,
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

/** Per-row actions menu (download a file, open a draft, resend a signing link). */
function FileRowActions({
  row,
  onResend,
  resendingId,
}: {
  row: FileRow;
  onResend: (contractId: string) => void;
  resendingId: string | null;
}) {
  // Resend is only offered for in-progress contracts; eligibility is the shared
  // rule (see `canResendContract`) that the server guard also enforces.
  const canResend = row.kind === "draft" && canResendContract(row.contract);
  const resending = row.kind === "draft" && resendingId === row.contractId;

  return (
    <TooltipDropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="size-4" />
          <span className="sr-only">File actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {row.kind === "file" ? (
          <>
            <DropdownMenuItem asChild>
              <a
                href={`${row.fileUrl}?inline=1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="size-4" />
                View signed PDF
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={row.fileUrl}>
                <Download className="size-4" />
                Download
              </a>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/contracts/${row.contractId}`}>
                <SquarePen className="size-4" />
                Open
              </Link>
            </DropdownMenuItem>
            {canResend && (
              <DropdownMenuItem
                disabled={resending}
                onSelect={() => onResend(row.contractId)}
              >
                {resending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Resend signing link
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </TooltipDropdownMenu>
  );
}

function buildColumns(
  createdByLabel: (row: FileRow) => string,
  onResend: (contractId: string) => void,
  resendingId: string | null,
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
        <div className="flex min-h-5 items-center">
          {row.original.contract ? (
            <ContractStatusChain contract={row.original.contract} />
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
      cell: ({ row }) => (
        <FileRowActions
          row={row.original}
          onResend={onResend}
          resendingId={resendingId}
        />
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
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const { resendingId, resend } = useResendSigningLink(uid);

  // Org user names rarely change within a session — fetch once.
  useEffect(() => {
    void getOrganizationUsers(organizationId)
      .then((users) =>
        setUserNames(Object.fromEntries(users.map((u) => [u.uid, u.fullName]))),
      )
      .catch((error) =>
        console.error("Failed to load organization users:", error),
      );
  }, [organizationId]);

  // Realtime project documents + contracts so the Files list — and especially the
  // contract Status chain (delivery/view/sign, incl. Delivery Failed) — updates
  // live, mirroring the contracts list. Both collections are queried by org (no
  // composite index) and filtered to this project in memory.
  useEffect(() => {
    const docsUnsub = onSnapshot(
      query(
        collection(db, "projectDocuments"),
        where("organizationId", "==", organizationId),
      ),
      (snapshot) => {
        setDocuments(
          snapshot.docs
            .map((d) => d.data() as ProjectDocument)
            .filter((d) => d.projectId === projectId),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load project files:", error);
        toast.error("Failed to fetch project files from database.");
        setLoading(false);
      },
    );

    const contractsUnsub = onSnapshot(
      query(
        collection(db, "contracts"),
        where("organizationId", "==", organizationId),
      ),
      (snapshot) => {
        setContracts(
          snapshot.docs
            .map((d) => d.data() as Contract)
            .filter((c) => c.projectId === projectId),
        );
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load project contracts:", error);
        toast.error("Failed to fetch project contracts from database.");
        setLoading(false);
      },
    );

    return () => {
      docsUnsub();
      contractsUnsub();
    };
  }, [organizationId, projectId]);

  const rows = useMemo(
    () => buildRows(documents, contracts),
    [documents, contracts],
  );

  // Auto-generated docs are stamped "system"; otherwise resolve the UID to a
  // name, showing "You" for the signed-in user.
  const createdByLabel = (row: FileRow): string => {
    if (row.createdBy === "system") return "System";
    if (row.createdBy === uid) return "You";
    return userNames[row.createdBy] ?? "—";
  };

  const columns = buildColumns(
    createdByLabel,
    (contractId) => void resend(contractId),
    resendingId,
  );

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
