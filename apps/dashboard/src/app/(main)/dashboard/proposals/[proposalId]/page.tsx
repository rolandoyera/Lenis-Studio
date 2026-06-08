"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import {
  ArmchairIcon,
  CoffeeTableIcon,
  ConsoleTableIcon,
  RugIcon,
  SofaIcon,
} from "@/components/icons/furniture-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const UNIT_TYPES = [
  "Each",
  "Per Ft",
  "Per Sq Ft",
  "Per Yd",
  "Lump Sum",
] as const;
type UnitType = (typeof UNIT_TYPES)[number];

interface LineItem {
  id: string;
  subcategory: string;
  name?: string;
  materials?: string;
  finishColor?: string;
  room: string;
  description?: string;
  dimensions?: string;
  unitType: UnitType;
  qty: number;
  sellingPrice: number;
  iconType: "sofa" | "armchair" | "table" | "rug" | "console";
}

/** Maps an item's iconType to its furniture icon component. */
const ICON_BY_TYPE: Record<LineItem["iconType"], typeof SofaIcon> = {
  sofa: SofaIcon,
  armchair: ArmchairIcon,
  table: CoffeeTableIcon,
  console: ConsoleTableIcon,
  rug: RugIcon,
};

const INITIAL_ITEMS: LineItem[] = [
  {
    id: "item-1",
    subcategory: "Sofa",
    name: "Gregory Sectional",
    materials: "Leather & Brass",
    finishColor: "Cream",
    room: "Living Room",
    description:
      "Cream leather / taupe accents. Tone-on-tone stitching 143. Brass details.",
    dimensions: "168″ W × 77″ D × 35″ H",
    unitType: "Each",
    qty: 1,
    sellingPrice: 16818,
    iconType: "sofa",
  },
  {
    id: "item-2",
    subcategory: "Sofa",
    name: "Gregory Sectional",
    materials: "Leather & Brass",
    finishColor: "Cream",
    room: "Living Room",
    description:
      "Cream leather / taupe accents. Tone-on-tone stitching 143. Brass details.",
    dimensions: "168″ W × 77″ D × 35″ H",
    unitType: "Each",
    qty: 1,
    sellingPrice: 16818,
    iconType: "sofa",
  },
];

/** Per-room dimensions, keyed by room name. */
const ROOM_DIMENSIONS: Record<string, string> = {
  "Living Room": "23′ × 15′–8″",
};

interface SortableRowProps {
  item: LineItem;
  onDelete: (id: string) => void;
  renderIcon: (type: LineItem["iconType"]) => React.ReactNode;
}

function SortableRow({ item, onDelete, renderIcon }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  // Apply the sort transform/transition to the row itself (the measured node) so the
  // dragged row stays perfectly column-aligned. When active, lift it above its neighbors.
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 10,
          background: "var(--surface)",
          boxShadow: "0 12px 30px rgba(60,50,40,0.15)",
        }
      : {}),
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      {/* Grip Handle Cell */}
      <TableCell className="px-4 py-5">
        <div
          {...attributes}
          {...listeners}
          className="drag-handle flex cursor-grab touch-none items-center justify-center p-1 text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing">
          <GripVertical className="size-4" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-5">
        <div className="thumb rounded-lg size-14 bg-muted/50 border flex items-center justify-center shrink-0">
          <span className="text-muted-foreground">
            {renderIcon(item.iconType)}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-5">
        <div className="flex items-center gap-3.5">
          <div>
            <div className="font-serif text-sm text-foreground">
              {item.subcategory}
            </div>
            {item.name && (
              <div className="text-[12px] text-muted-foreground">
                {item.name}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-5">
        <span className="text-[12px] text-muted-foreground">
          {item.materials || "—"}
        </span>
      </TableCell>
      <TableCell className="px-4 py-5">
        <span className="text-[12px] text-muted-foreground">
          {item.finishColor || "—"}
        </span>
      </TableCell>
      <TableCell className="px-4 py-5">
        <p className="text-[12px] text-muted-foreground max-w-80 text-ellipsis">
          {item.description || "—"}
        </p>
      </TableCell>
      <TableCell
        className="text-muted-foreground text-[12px]"
        style={{ textAlign: "left" }}>
        {item.dimensions || "—"}
      </TableCell>
      <TableCell
        className="text-muted-foreground text-[12px]"
        style={{ textAlign: "left" }}>
        {item.unitType}
      </TableCell>
      <TableCell className="text-muted-foreground text-[12px] text-right">
        {item.qty}
      </TableCell>
      <TableCell className="text-muted-foreground text-[12px] text-right">
        {formatCurrency(item.sellingPrice, { noDecimals: true })}
      </TableCell>
      <TableCell className="text-muted-foreground text-[12px] text-right">
        {formatCurrency(item.sellingPrice * item.qty, { noDecimals: true })}
      </TableCell>
      {/* Action Delete Cell */}
      <TableCell>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="opacity-20 transition-all bg-destructive/10 hover:text-destructive hover:opacity-100">
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

/**
 * Reorder a single room's items within the flat list, keeping every room's slots
 * in place. Safe even when rooms are interleaved in the global array.
 */
function reorderWithinRoom(
  items: LineItem[],
  room: string,
  activeId: string,
  overId: string,
): LineItem[] {
  const positions: number[] = [];
  items.forEach((it, idx) => {
    if (it.room === room) positions.push(idx);
  });
  const roomItems = positions.map((p) => items[p]);
  const oldIndex = roomItems.findIndex((it) => it.id === activeId);
  const newIndex = roomItems.findIndex((it) => it.id === overId);
  if (oldIndex === -1 || newIndex === -1) return items;

  const newOrder = arrayMove(roomItems, oldIndex, newIndex);
  const result = [...items];
  positions.forEach((p, k) => {
    result[p] = newOrder[k];
  });
  return result;
}

interface RoomSectionProps {
  room: string;
  items: LineItem[];
  sensors: ReturnType<typeof useSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (room: string, event: DragEndEvent) => void;
  onDragCancel: () => void;
  onDelete: (id: string) => void;
  renderIcon: (type: LineItem["iconType"]) => React.ReactNode;
}

/** A single room: its own sortable table and subtotal footer. */
function RoomSection({
  room,
  items,
  sensors,
  onDragStart,
  onDragEnd,
  onDragCancel,
  onDelete,
  renderIcon,
}: RoomSectionProps) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.sellingPrice * item.qty,
    0,
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <Button type="button" className="w-fit ml-auto">
          <Plus className="size-4" /> Add Line Item
        </Button>
      </CardHeader>
      <CardContent>
        {/* Section Header */}
        <div className="flex items-center justify-between py-6 px-9 border-b border-border">
          <div className="flex items-baseline gap-4">
            <span className="italic font-light text-2xl tracking-tight font-serif">
              {room}
            </span>
            <span className="text-[11px] tracking-[0.14em] font-light">
              {ROOM_DIMENSIONS[room] ??
                `${items.length} ${items.length === 1 ? "item" : "items"}`}
            </span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={onDragStart}
          onDragEnd={(event) => onDragEnd(room, event)}
          onDragCancel={onDragCancel}>
          <Table>
            <TableHeader>
              <TableRow className="text-xs tracking-widest uppercase py-3.5 px-4">
                <TableHead className="w-10" />
                <TableHead className="w-16" />
                <TableHead style={{ width: "180px" }}>Item</TableHead>
                <TableHead style={{ width: "140px" }}>Materials</TableHead>
                <TableHead style={{ width: "120px" }}>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead style={{ width: "230px" }}>Dimensions</TableHead>
                <TableHead style={{ width: "90px" }}>Unit</TableHead>
                <TableHead className="w-10">Qty</TableHead>
                <TableHead className="text-right w-20">Price</TableHead>
                <TableHead className="text-right w-24">Total</TableHead>
                <TableHead style={{ width: "50px" }} />
              </TableRow>
            </TableHeader>
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}>
              <TableBody className="border-b-0">
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onDelete={onDelete}
                    renderIcon={renderIcon}
                  />
                ))}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-18">
        <div className="text-right">
          <Label className="font-light uppercase tracking-widest mb-1">
            Items
          </Label>
          <div className="font-serif text-2xl font-light tabular-nums">
            {items.length}
          </div>
        </div>
        <div className="w-px h-9 bg-border" />
        <div className="text-right">
          <Label className="font-light uppercase tracking-widest mb-1">
            Section Total
          </Label>
          <div className="font-serif text-2xl font-light tabular-nums">
            {formatCurrency(subtotal, { noDecimals: true })}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params?.proposalId as string;

  const [items, setItems] = useState<LineItem[]>(INITIAL_ITEMS);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Group items into rooms (preserving first-appearance order), then total everything.
  const rooms = useMemo(() => {
    const order: string[] = [];
    const byRoom = new Map<string, LineItem[]>();
    for (const item of items) {
      const existing = byRoom.get(item.room);
      if (existing) {
        existing.push(item);
      } else {
        byRoom.set(item.room, [item]);
        order.push(item.room);
      }
    }
    return order.map((room) => ({
      room,
      items: byRoom.get(room) as LineItem[],
    }));
  }, [items]);

  const grandTotal = items.reduce(
    (sum, item) => sum + item.sellingPrice * item.qty,
    0,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Reordering is scoped to the room the drag started in.
  const handleDragEnd = (room: string, event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setItems((prev) =>
      reorderWithinRoom(prev, room, active.id as string, over.id as string),
    );
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  // CRUD actions
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const renderIcon = (type: LineItem["iconType"]) => {
    const Icon = ICON_BY_TYPE[type];
    return <Icon size={22} strokeWidth={1.3} />;
  };

  return (
    <div
      data-content-padding="false"
      className={`bg-card proposal-page-container min-h-screen w-full`}>
      {activeId && <style>{`* { cursor: grabbing !important; }`}</style>}
      <style>{`
        .proposal-page-container {
          --surface: #ffffff;
          --surface-2: #f2efe9;
          --border-strong: rgba(60,50,40,0.18);
          --text-primary: #1a1714;
          --text-secondary: #5a5248;
          --text-tertiary: #9a9088;
          --accent: #c8a97e;
          --accent-pale: #f5ede0;
          --accent-text: #7a5c30;
          --warning-bg: #fdf3e3;
          --warning-text: #8a5c1a;
          --warning-border: #e8c878;
          color: var(--text-primary);
          padding: 48px 60px;
          -webkit-font-smoothing: antialiased;
        }
        /* ── Room Section ── */
        .room-section {
          background: var(--surface);
          border-radius: 16px;
          overflow: hidden;
          border: 0.5px solid var(--border);
        }
        .proposal-header { animation: fadeUp 0.4s ease both; }
        .room-section    { animation: fadeUp 0.5s 0.1s ease both; }
      `}</style>

      {/* Header */}
      <header className="flex items-start justify-between mb-12">
        <div>
          <div className="size-11 flex items-center justify-center mb-2">
            {/* Company Logo Here */}
            <Image
              src="/logo_sdg-S-only.svg"
              alt="Logo"
              width={54}
              height={54}
              className="dark:invert"
            />
          </div>
          <div className="text-foreground">Fallback Co. Name</div>
        </div>

        <div className="flex flex-col gap-1 text-foreground">
          <div className="grid grid-cols-2 gap-2">
            <Label size="large">Client</Label>
            <span>Anna Birman</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Label size="large">Address</Label>
            <span>123 Main St</span>
          </div>
          <div className="grid grid-cols-2 gap-2 -mt-2">
            <Label size="large" />
            <span>Toronto, ON 55555</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Label size="large">Project #</Label>
            <span>{proposalId || "0"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Label size="large">Budget</Label>
            <span>$85,000.00</span>
          </div>
          <Separator className="w-full bg-accent-foreground/15" />
          <div className="grid grid-cols-2 gap-2">
            <Label size="large">Total</Label>
            <span>{formatCurrency(grandTotal, { noDecimals: true })}</span>
          </div>
        </div>
      </header>

      {/* Rooms — one sortable table per room */}
      {rooms.length === 0 ? (
        <div className="room-section flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <p className="font-medium text-(--text-secondary) text-sm">
            No line items yet
          </p>
          <p className="max-w-[280px] text-(--text-tertiary) text-xs">
            Use “Add Line Item” to start building out rooms for this proposal.
          </p>
          <Button type="button" variant="default">
            <Plus className="size-4" /> Add Line Item
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {rooms.map(({ room, items: roomItems }) => (
            <RoomSection
              key={room}
              room={room}
              items={roomItems}
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              onDelete={handleDeleteItem}
              renderIcon={renderIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
}
