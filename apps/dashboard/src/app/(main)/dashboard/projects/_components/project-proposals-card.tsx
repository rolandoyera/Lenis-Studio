"use client";

import Link from "next/link";

import { ArrowRight, FileText, Loader2, Plus, ReceiptText } from "lucide-react";

import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Proposal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ProjectProposalsCardProps {
  proposals: Proposal[];
  onAddProposal: () => void;
  addingProposal: boolean;
}

export function ProjectProposalsCard({
  proposals,
  onAddProposal,
  addingProposal,
}: ProjectProposalsCardProps) {
  const getStatusVariant = (
    status: Proposal["status"],
  ): ComponentProps<typeof Badge>["variant"] => {
    switch (status) {
      case "Approved":
        return "success";
      case "Sent":
        return "info";
      case "Revised":
        return "warning";
      default:
        return "outline";
    }
  };

  return (
    <Card variant="panel">
      <CardHeader>
        <CardTitle>
          <ReceiptText className="icons" />
          Project Proposals
        </CardTitle>
        <Button
          size="sm"
          onClick={onAddProposal}
          disabled={addingProposal}
          className="flex items-center gap-1.5">
          {addingProposal ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Plus className="size-3" />
          )}
          Add Proposal
        </Button>
      </CardHeader>
      <CardContent className="p-0 text-sm">
        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center text-muted-foreground">
            <FileText className="mb-2 size-10 text-muted-foreground/30" />
            <p className="text-xs">
              No proposals generated for this project yet.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={onAddProposal}
              className="mt-1 h-auto p-0 font-medium">
              Create First Proposal
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wider">
                <TableHead>Proposal Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow
                  key={proposal.proposalId}
                  className="group hover:bg-muted/30">
                  <TableCell className="py-4 font-medium font-serif text-foreground">
                    <div className="flex flex-col">
                      <Link
                        href={`/dashboard/proposals/${proposal.proposalId}`}
                        prefetch={false}
                        className="hover:text-primary hover:underline">
                        {proposal.title || "Untitled Proposal"}
                      </Link>
                      <span className="mt-0.5 text-[11px] text-muted-foreground/70">
                        {new Date(proposal.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(proposal.status)}>
                      {proposal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(proposal.grandTotal, { noDecimals: true })}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/proposals/${proposal.proposalId}`}
                      prefetch={false}
                      className="flex items-center gap-0.5 font-semibold text-muted-foreground text-xs opacity-0 transition-opacity hover:text-primary group-hover:opacity-100">
                      Open
                      <ArrowRight className="size-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
