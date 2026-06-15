"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPhone } from "@/lib/utils";
import type { OpportunityRow } from "./schema";

export const opportunitiesColumns: ColumnDef<OpportunityRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all opportunities"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.referrer}`}
      />
    ),
    enableHiding: false,
  },
  {
    id: "name",
    header: "Name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => (
      <div className="font-medium text-sm">
        {row.original.firstName} {row.original.lastName}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-muted-foreground text-sm">{row.original.email}</div>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div className="text-sm tabular-nums">{formatPhone(row.original.phone)}</div>,
  },
  {
    accessorKey: "referrer",
    header: "Referrer",
    cell: ({ row }) => <div className="font-medium text-sm">{row.original.referrer}</div>,
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => (
      <Badge variant="outline" className="rounded-full px-2.5">
        {row.original.stage}
      </Badge>
    ),
    filterFn: "equalsString",
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => <div className="text-sm">{row.original.priority}</div>,
  },

  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => <div className="font-medium text-sm tabular-nums">{row.original.value}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Edit</div>,
    cell: () => (
      <div className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full text-muted-foreground hover:bg-transparent focus-visible:bg-transparent"
        >
          <Pencil />
          <span className="sr-only">Edit opportunity</span>
        </Button>
      </div>
    ),
    enableHiding: false,
  },
];
