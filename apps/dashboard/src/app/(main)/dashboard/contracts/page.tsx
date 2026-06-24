"use client";

import { type ReactNode, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  CircleCheck,
  FileText,
  Loader2,
  Plus,
  Send,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import PageHeader from "@/components/page-header";
import { PageTitle } from "@/components/page-title-updater";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getContracts } from "@/lib/db";
import type { Contract } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { ContractStatusBadge } from "./_components/contract-status-badge";

function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            {label}
          </span>
          <span className="font-semibold text-2xl text-foreground">
            {value}
          </span>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent}`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

/** "Jun 18, 2026" from an epoch-ms timestamp. */
function formatUpdated(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** The contract's headline figure is the initial retainer (a raw number string). */
function retainerLabel(contract: Contract): string {
  const raw = contract.values.RETAINER_FEE;
  const amount = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(amount)
    ? formatCurrency(amount, { noDecimals: true })
    : "—";
}

export default function ContractsPage() {
  const router = useRouter();
  const { organizationId, loading: authLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dep; profile identity churns

    async function loadContracts() {
      try {
        setContracts(await getContracts(orgId));
      } catch (error) {
        console.error("Failed to load contracts:", error);
        toast.error("Failed to fetch contracts from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadContracts();
  }, [organizationId, authLoading]);

  const drafts = contracts.filter((c) => c.status === "draft").length;
  const sent = contracts.filter((c) => c.status === "sent").length;
  const signed = contracts.filter((c) => c.status === "signed").length;
  // Anything sent or viewed but not yet signed is awaiting the client.
  const needsAttention = contracts.filter(
    (c) => c.status === "sent" || c.status === "viewed",
  ).length;

  return (
    <>
      <PageTitle title="Contracts" />
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Contracts"
            description="Draft, send, and track client design agreements."
          />
          <Button asChild className="sm:self-start">
            <Link href="/dashboard/contracts/new">
              <Plus className="size-4" />
              New Contract
            </Link>
          </Button>
        </div>

        {/* Metric summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Drafts"
            value={drafts}
            accent="bg-muted text-muted-foreground"
            icon={<FileText className="size-5" />}
          />
          <MetricCard
            label="Sent"
            value={sent}
            accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
            icon={<Send className="size-5" />}
          />
          <MetricCard
            label="Signed"
            value={signed}
            accent="bg-green-500/10 text-green-600 dark:text-green-400"
            icon={<CircleCheck className="size-5" />}
          />
          <MetricCard
            label="Needs Attention"
            value={needsAttention}
            accent="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            icon={<TriangleAlert className="size-5" />}
          />
        </div>

        {/* Contracts table */}
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Retainer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground text-sm"
                  >
                    No contracts yet. Create your first one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map((contract) => (
                  <TableRow
                    key={contract.contractId}
                    onClick={() =>
                      router.push(`/dashboard/contracts/${contract.contractId}`)
                    }
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium text-foreground">
                      {contract.title}
                    </TableCell>
                    <TableCell>{contract.clientName}</TableCell>
                    <TableCell>{contract.projectName}</TableCell>
                    <TableCell className="text-right font-mono text-foreground/80">
                      {retainerLabel(contract)}
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatUpdated(contract.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
