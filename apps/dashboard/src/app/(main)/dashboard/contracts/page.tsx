import type { ReactNode } from "react";

import Link from "next/link";

import {
  CircleCheck,
  FileText,
  Plus,
  Send,
  TriangleAlert,
} from "lucide-react";

import { PageTitle } from "@/components/page-title-updater";
import PageHeader from "@/components/page-header";
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
import { formatCurrency } from "@/lib/utils";

import { ContractStatusBadge } from "./_components/contract-status-badge";
import { MOCK_CONTRACTS } from "./_components/contracts-mock";

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
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContractsPage() {
  const drafts = MOCK_CONTRACTS.filter((c) => c.status === "draft").length;
  const sent = MOCK_CONTRACTS.filter((c) => c.status === "sent").length;
  const signed = MOCK_CONTRACTS.filter((c) => c.status === "signed").length;
  // Anything sent or viewed but not yet signed is awaiting the client.
  const needsAttention = MOCK_CONTRACTS.filter(
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
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CONTRACTS.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium text-foreground">
                    {contract.title}
                  </TableCell>
                  <TableCell>{contract.client}</TableCell>
                  <TableCell>{contract.project}</TableCell>
                  <TableCell className="text-right font-mono text-foreground/80">
                    {formatCurrency(contract.value, { noDecimals: true })}
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {contract.updatedAt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
