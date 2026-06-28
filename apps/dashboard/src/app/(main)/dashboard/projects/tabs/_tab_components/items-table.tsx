"use client";
"use no memo";

import type { ReactNode, CSSProperties } from "react";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ColumnDef, Row, VisibilityState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { GripVertical, Pencil, ShoppingBag, Trash2 } from "lucide-react";

import { DashboardImage } from "@/components/dashboard-image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProjectRoomItem, Vendor } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

// ----------------------------------------------------
// Field registry — the single source of truth for the items table. Each entry
// becomes a TanStack column, a column-picker option, and a default-visibility
// flag, so the three never drift apart.
// ----------------------------------------------------

interface ItemFieldDef {
  id: string;
  label: string;
  defaultVisible: boolean;
  /** Sort/accessor value; also used as the fallback display value. */
  value: (item: ProjectRoomItem) => string | number;
  /** Custom cell renderer; defaults to `value` (or "—" when empty). */
  render?: (item: ProjectRoomItem, vendor?: Vendor) => ReactNode;
  /** Right-align the header + cells (numeric columns). */
  align?: "right";
  /** Allow the cell text to wrap instead of truncating. */
  wrap?: boolean;
  /** Tailwind width hint for the column. */
  width?: string;
  /** Render the cell value in a monospace face. */
  mono?: boolean;
  /** Extra cell classes (e.g. emphasis on Total). */
  cellClassName?: string;
}

const ITEM_FIELDS: ItemFieldDef[] = [
  {
    id: "item",
    label: "Item",
    defaultVisible: true,
    width: "w-[180px]",
    value: (item) => item.name,
    render: (item, vendor) => (
      <>
        <div className="truncate font-semibold text-foreground text-sm">
          {item.name}
        </div>
        {vendor && (
          <div className="truncate text-muted-foreground text-xs">
            {vendor.name}
          </div>
        )}
      </>
    ),
  },
  {
    id: "sku",
    label: "SKU",
    defaultVisible: false,
    mono: true,
    value: (item) => item.sku ?? "",
  },
  {
    id: "category",
    label: "Category",
    defaultVisible: false,
    value: (item) => item.category ?? "",
  },
  {
    id: "subcategory",
    label: "Subcategory",
    defaultVisible: false,
    value: (item) => item.subcategory ?? "",
  },
  {
    id: "materials",
    label: "Materials",
    defaultVisible: true,
    width: "w-[120px]",
    wrap: true,
    value: (item) => item.materials ?? "",
  },
  {
    id: "finishColor",
    label: "Color",
    defaultVisible: true,
    value: (item) => item.finishColor ?? "",
  },
  {
    id: "manufacturer",
    label: "Manufacturer",
    defaultVisible: false,
    value: (item) => item.manufacturer ?? "",
  },
  {
    id: "description",
    label: "Description",
    defaultVisible: true,
    width: "w-[200px]",
    wrap: true,
    value: (item) => item.description ?? "",
  },
  {
    id: "poDescription",
    label: "PO Description",
    defaultVisible: false,
    width: "w-[200px]",
    wrap: true,
    value: (item) => item.poDescription ?? "",
  },
  {
    id: "internalNote",
    label: "Internal Note",
    defaultVisible: false,
    width: "w-[200px]",
    wrap: true,
    value: (item) => item.internalNote ?? "",
  },
  {
    id: "dimensions",
    label: "Dimensions",
    defaultVisible: true,
    value: (item) => item.dimensions ?? "",
  },
  {
    id: "unitType",
    label: "Unit",
    defaultVisible: true,
    value: (item) => item.unitType,
  },
  {
    id: "costType",
    label: "Cost Type",
    defaultVisible: false,
    value: (item) => item.costType,
  },
  {
    id: "tags",
    label: "Tags",
    defaultVisible: false,
    wrap: true,
    value: (item) => (item.tags?.length ? item.tags.join(", ") : ""),
  },
  {
    id: "taxable",
    label: "Taxable",
    defaultVisible: false,
    value: (item) => (item.taxable ? "Yes" : "No"),
  },
  {
    id: "unitCost",
    label: "Unit Cost",
    defaultVisible: false,
    align: "right",
    value: (item) => item.unitCost,
    render: (item) => formatCurrency(item.unitCost),
  },
  {
    id: "markup",
    label: "Markup %",
    defaultVisible: false,
    align: "right",
    value: (item) => item.markup,
    render: (item) => `${item.markup}%`,
  },
  {
    id: "msrp",
    label: "MSRP",
    defaultVisible: false,
    align: "right",
    value: (item) => item.msrp ?? 0,
    render: (item) => (item.msrp ? formatCurrency(item.msrp) : "—"),
  },
  {
    id: "quantity",
    label: "Qty",
    defaultVisible: true,
    align: "right",
    value: (item) => item.quantity,
  },
  {
    id: "sellingPrice",
    label: "Price",
    defaultVisible: true,
    align: "right",
    value: (item) => item.sellingPrice,
    render: (item) => formatCurrency(item.sellingPrice),
  },
  {
    id: "total",
    label: "Total",
    defaultVisible: true,
    align: "right",
    cellClassName: "font-semibold text-primary",
    value: (item) => item.sellingPrice * item.quantity,
    render: (item) => formatCurrency(item.sellingPrice * item.quantity),
  },
];

/** Column-picker options (toggleable fields only — thumbnail/actions excluded). */
export const ITEM_COLUMN_OPTIONS = ITEM_FIELDS.map((f) => ({
  id: f.id,
  label: f.label,
}));

/** Default visibility map, derived from each field's `defaultVisible`. */
export const DEFAULT_ITEM_COLUMN_VISIBILITY: VisibilityState =
  Object.fromEntries(ITEM_FIELDS.map((f) => [f.id, f.defaultVisible]));

// ----------------------------------------------------
// Column definitions
// ----------------------------------------------------

function buildColumns(
  vendors: Vendor[],
  onEditItem: (item: ProjectRoomItem) => void,
  onDeleteItem: (item: ProjectRoomItem) => void,
): ColumnDef<ProjectRoomItem>[] {
  const thumbnail: ColumnDef<ProjectRoomItem> = {
    id: "thumbnail",
    header: () => null,
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {item.coverImageUrl ? (
            <DashboardImage
              src={item.coverImageUrl}
              alt={item.name}
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <ShoppingBag className="size-5 text-muted-foreground/30" />
          )}
        </div>
      );
    },
  };

  const fieldColumns: ColumnDef<ProjectRoomItem>[] = ITEM_FIELDS.map(
    (field) => ({
      id: field.id,
      header: () => field.label,
      cell: ({ row }) => {
        const item = row.original;
        if (field.render) {
          const vendor = vendors.find((v) => v.vendorId === item.vendorId);
          return field.render(item, vendor);
        }
        return field.value(item) || "—";
      },
    }),
  );

  const actions: ColumnDef<ProjectRoomItem> = {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onEditItem(item)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">Edit item</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDeleteItem(item)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete item</span>
          </Button>
        </div>
      );
    },
  };

  return [thumbnail, ...fieldColumns, actions];
}

// Per-column header/body classes, keyed by column id. Built once from the field
// registry plus the two structural columns.
const FIELD_BY_ID = new Map(ITEM_FIELDS.map((f) => [f.id, f]));

const HEAD_BASE = "text-xs uppercase tracking-widest text-muted-foreground";

function headClass(columnId: string): string {
  if (columnId === "thumbnail") return "w-16";
  if (columnId === "actions") return "w-[90px] text-right";
  const field = FIELD_BY_ID.get(columnId);
  if (!field) return HEAD_BASE;
  return cn(HEAD_BASE, field.width, field.align === "right" && "text-right");
}

function cellClass(columnId: string): string | undefined {
  if (columnId === "thumbnail" || columnId === "actions") return "py-4";
  const field = FIELD_BY_ID.get(columnId);
  if (!field) return undefined;
  return cn(
    "py-4 text-muted-foreground text-xs",
    field.width,
    field.wrap ? "whitespace-normal" : "truncate",
    field.align === "right" && "text-right",
    field.mono && "font-mono",
    field.cellClassName,
  );
}

// ----------------------------------------------------
// Table
// ----------------------------------------------------

/** A draggable body row: the grip handle drives the reorder, cells follow. */
function SortableItemRow({ row }: { row: Row<ProjectRoomItem> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.roomItemId });

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging &&
          "relative z-10 bg-white! shadow-[0_12px_30px_rgba(60,50,40,0.15)] dark:bg-white/20!",
      )}
    >
      <TableCell className="py-4">
        <div
          {...attributes}
          {...listeners}
          className="flex cursor-grab touch-none items-center justify-center p-1 text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
          <span className="sr-only">Drag to reorder</span>
        </div>
      </TableCell>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className={cellClass(cell.column.id)}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

interface ItemsTableProps {
  items: ProjectRoomItem[];
  vendors: Vendor[];
  /** Controlled column visibility shared across every section's table. */
  columnVisibility: VisibilityState;
  onEditItem: (item: ProjectRoomItem) => void;
  onDeleteItem: (item: ProjectRoomItem) => void;
}

/**
 * The list-view table for a single section's items. A TanStack-powered variant
 * of the shared `TanTable`, with per-column widths, wrapping, and alignment the
 * generic table can't express. Rows reorder by dragging the grip handle, and can
 * be dragged across sections — the surrounding `DndContext` (owned by the parent)
 * spans every section. Column visibility is controlled by the parent so one
 * picker drives every section consistently.
 */
export function ItemsTable({
  items,
  vendors,
  columnVisibility,
  onEditItem,
  onDeleteItem,
}: ItemsTableProps) {
  const columns = buildColumns(vendors, onEditItem, onDeleteItem);

  const table = useReactTable({
    data: items,
    columns,
    state: { columnVisibility },
    getRowId: (row) => row.roomItemId,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            <TableHead className="w-10" />
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={headClass(header.column.id)}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <SortableContext
        items={items.map((item) => item.roomItemId)}
        strategy={verticalListSortingStrategy}
      >
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <SortableItemRow key={row.id} row={row} />
          ))}
        </TableBody>
      </SortableContext>
    </Table>
  );
}
