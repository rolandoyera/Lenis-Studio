"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Lead } from "@/lib/types";

import {
  BUDGET_RANGE_LABELS,
  getLeadName,
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_VARIANT,
  PROPERTY_TYPE_LABELS,
} from "./lead-constants";

/**
 * Builds the leads table columns. `userMap` resolves stored UIDs (e.g. `assignedTo`) into
 * full names — user references are never denormalized onto the lead document. The current
 * user's UID resolves to "You".
 */
export function getLeadsColumns(
  userMap: Record<string, string>,
  currentUserId?: string,
): ColumnDef<Lead>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all leads"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${getLeadName(row.original)}`}
        />
      ),
      enableHiding: false,
    },
    {
      // Hidden column powering the global search (name + email + company).
      id: "search",
      accessorFn: (row) =>
        `${getLeadName(row)} ${row.email ?? ""} ${row.company ?? ""}`,
      filterFn: "includesString",
    },
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => getLeadName(row),
      cell: ({ row }) => (
        <Link
          href={`/dashboard/leads/${row.original.uid}`}
          className="font-medium text-sm hover:text-primary hover:underline"
        >
          {getLeadName(row.original)}
        </Link>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {row.original.company || "—"}
        </div>
      ),
    },
    {
      accessorKey: "stage",
      header: "Stage",
      filterFn: "equalsString",
      cell: ({ row }) => {
        return (
          <Badge variant={LEAD_STAGE_VARIANT[row.original.stage]}>
            {LEAD_STAGE_LABELS[row.original.stage]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "propertyType",
      header: "Property Type",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.propertyType
            ? PROPERTY_TYPE_LABELS[row.original.propertyType]
            : "—"}
        </div>
      ),
    },
    {
      accessorKey: "budgetRange",
      header: "Budget Range",
      cell: ({ row }) => (
        <div className="text-sm tabular-nums">
          {row.original.budgetRange
            ? BUDGET_RANGE_LABELS[row.original.budgetRange]
            : "—"}
        </div>
      ),
    },
    {
      id: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        let label = "Unassigned";
        if (assignedTo) {
          label =
            assignedTo === currentUserId
              ? "You"
              : (userMap[assignedTo] ?? "Unknown user");
        }
        return <div className="text-sm">{label}</div>;
      },
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.source ? LEAD_SOURCE_LABELS[row.original.source] : "—"}
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated At",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm tabular-nums">
          {format(new Date(row.original.updatedAt), "MMM d, yyyy")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            <Link href={`/dashboard/leads/${row.original.uid}`}>
              <Eye />
              <span className="sr-only">View lead</span>
            </Link>
          </Button>
        </div>
      ),
      enableHiding: false,
    },
  ];
}
