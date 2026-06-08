"use client";

import { useMemo, useState } from "react";

import { DM_Sans, Fraunces } from "next/font/google";
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

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["italic", "normal"],
  variable: "--font-fraunces",
});

interface LineItem {
  id: string;
  name: string;
  subText?: string;
  materials?: string;
  color?: string;
  room: string;
  description?: string;
  status: "Pending" | "Approved" | "Rejected";
  dimensions?: string;
  qty: number;
  price: number;
  iconType: "sofa" | "armchair" | "table" | "rug" | "console";
}

const INITIAL_ITEMS: LineItem[] = [
  {
    id: "item-1",
    name: "Sofa",
    subText: "Gregory Sectional",
    materials: "Cream Leather & Brass",
    color: "Cream",
    room: "Living Room",
    description:
      "Cream leather / taupe accents. Tone-on-tone stitching 143. Brass details.",
    status: "Pending",
    dimensions: "168″ W × 77″ D × 35″ H",
    qty: 1,
    price: 16818,
    iconType: "sofa",
  },
  {
    id: "item-2",
    name: "Armchair",
    subText: "Sophie Armchair",
    materials: "Leather & Fabric",
    color: "Cream / Taupe",
    room: "Living Room",
    description:
      "Cream leather inside and seat fabric back / taupe detail in back. Tone-on-tone stitching 143.",
    status: "Pending",
    dimensions: "33″ W × 33″ D × 29″ H",
    qty: 1,
    price: 2978,
    iconType: "armchair",
  },
  {
    id: "item-3",
    name: "Coffee Table",
    subText: "Morgan — small",
    materials: "Leather & Ceramic",
    color: "Taupe / Stone Grey",
    room: "Living Room",
    description: "Taupe leather base / stone grey ceramic top.",
    status: "Pending",
    dimensions: "24″ W × 20″ D × 14″ H",
    qty: 1,
    price: 2088,
    iconType: "table",
  },
  {
    id: "item-4",
    name: "Coffee Table",
    subText: "Morgan — large",
    materials: "Leather & Ceramic",
    color: "Taupe / Stone Grey",
    room: "Living Room",
    description: "Taupe leather base / stone grey ceramic top.",
    status: "Pending",
    dimensions: "54″ W × 38″ D × 12.5″ H",
    qty: 1,
    price: 3677,
    iconType: "table",
  },
  {
    id: "item-5",
    name: "Console Table",
    subText: "",
    materials: "Wood, Marble & Glass",
    color: "Titanium / Grey",
    room: "Living Room",
    description:
      "Titanium wood frame. Grey Crystalart marble glass details and top.",
    status: "Pending",
    dimensions: "86.5″ W × 18″ D × 30″ H",
    qty: 1,
    price: 6838,
    iconType: "console",
  },
  {
    id: "item-6",
    name: "Rug",
    subText: "Asher Hand-Knotted",
    materials: "Wool (Hand-Knotted)",
    color: "Natural",
    room: "Living Room",
    description: "",
    status: "Pending",
    dimensions: "10′ W × 14′ D",
    qty: 1,
    price: 4620,
    iconType: "rug",
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
    <tr ref={setNodeRef} style={style} className="group">
      {/* Grip Handle Cell */}
      <td>
        <div
          {...attributes}
          {...listeners}
          className="drag-handle flex cursor-grab touch-none items-center justify-center p-1 text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing">
          <GripVertical className="size-4" />
        </div>
      </td>
      <td>
        <div className="thumb">{renderIcon(item.iconType)}</div>
      </td>
      <td>
        <div className="item-wrap">
          <div>
            <div className="item-name">{item.name}</div>
            {item.subText && (
              <div className="text-[12px] text-muted-foreground">
                {item.subText}
              </div>
            )}
          </div>
        </div>
      </td>
      <td>
        <span className="text-[12px] text-muted-foreground">
          {item.materials || "—"}
        </span>
      </td>
      <td>
        <span className="text-[12px] text-muted-foreground">
          {item.color || "—"}
        </span>
      </td>
      <td>
        <p className="text-[12px] text-muted-foreground">
          {item.description || "—"}
        </p>
      </td>
      <td
        className="text-muted-foreground text-[12px]"
        style={{ textAlign: "left" }}>
        {item.dimensions || "—"}
      </td>
      <td className="dim">{item.qty}</td>
      <td className="price">
        {formatCurrency(item.price, { noDecimals: true })}
      </td>
      <td className="total">
        {formatCurrency(item.price * item.qty, { noDecimals: true })}
      </td>
      {/* Action Delete Cell */}
      <td>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          title="Delete Item">
          <Trash2 className="size-4" />
        </button>
      </td>
    </tr>
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
  onAddItem: (room: string) => void;
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
  onAddItem,
  renderIcon,
}: RoomSectionProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Card>
      <CardHeader className="border-b">
        <Button onClick={() => onAddItem(room)} className="w-fit ml-auto">
          <Plus className="size-4" /> Add Line Item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="room-header">
          <div className="room-title-group">
            <span className="room-title">{room}</span>
            <span className="room-dims">
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
          <table className="proposal-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }} />
                <th style={{ width: "72px" }} />
                <th style={{ width: "180px" }}>Item</th>
                <th style={{ width: "140px" }}>Materials</th>
                <th style={{ width: "120px" }}>Color</th>
                <th>Description</th>
                <th style={{ width: "230px" }}>Dimensions</th>
                <th className="r" style={{ width: "40px" }}>
                  Qty
                </th>
                <th className="r" style={{ width: "80px" }}>
                  Price
                </th>
                <th className="r" style={{ width: "88px" }}>
                  Total
                </th>
                <th style={{ width: "50px" }} />
              </tr>
            </thead>
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}>
              <tbody>
                {items.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onDelete={onDelete}
                    renderIcon={renderIcon}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </CardContent>

      <CardFooter className="flex items-center justify-end gap-18">
        <div className="text-right">
          <Label className="text-xs font-light text-muted-foreground uppercase tracking-[0.16em]">
            Items
          </Label>
          <div className="footer-value muted">{items.length}</div>
        </div>
        <div className="footer-divider" />
        <div className="text-right">
          <div className="footer-label">Room Total</div>
          <div className="footer-value">
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

  // Add Item Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    subText: "",
    materials: "",
    color: "",
    room: "Living Room",
    description: "",
    status: "Pending" as const,
    dimensions: "",
    qty: 1,
    price: "",
    iconType: "sofa" as const,
  });

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
    (sum, item) => sum + item.price * item.qty,
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

  // Open the Add dialog pre-filled with the room it was launched from.
  const openAddDialog = (room?: string) => {
    if (room) setNewItem((prev) => ({ ...prev, room }));
    setIsAddOpen(true);
  };

  // CRUD actions
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    const parsedPrice = Number(newItem.price.replace(/[^0-9.]/g, "")) || 0;

    const created: LineItem = {
      id: `item-${Date.now()}`,
      name: newItem.name.trim(),
      subText: newItem.subText.trim() || undefined,
      materials: newItem.materials.trim() || undefined,
      color: newItem.color.trim() || undefined,
      room: newItem.room.trim() || "Living Room",
      description: newItem.description.trim() || undefined,
      status: newItem.status,
      dimensions: newItem.dimensions.trim() || undefined,
      qty: Number(newItem.qty) || 1,
      price: parsedPrice,
      iconType: newItem.iconType,
    };

    setItems((prev) => [...prev, created]);
    setIsAddOpen(false);

    // Reset Form State
    setNewItem({
      name: "",
      subText: "",
      materials: "",
      color: "",
      room: "Living Room",
      description: "",
      status: "Pending",
      dimensions: "",
      qty: 1,
      price: "",
      iconType: "sofa",
    });
  };

  const renderIcon = (
    type: "sofa" | "armchair" | "table" | "rug" | "console",
  ) => {
    switch (type) {
      case "sofa":
        return (
          <svg viewBox="0 0 24 24">
            <title>Sofa Icon</title>
            <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0-2 2v3H4v-3a2 2 0 0 0-2-2V9z" />
            <path d="M4 16v2m16-2v2M7 11V7m10 4V7" />
          </svg>
        );
      case "armchair":
        return (
          <svg viewBox="0 0 24 24">
            <title>Armchair Icon</title>
            <path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" />
            <path d="M3 11a2 2 0 0 1 2 2v2h14v-2a2 2 0 0 1 2-2H3z" />
            <path d="M5 15v3m14-3v3" />
          </svg>
        );
      case "table":
        return (
          <svg viewBox="0 0 24 24">
            <title>Table Icon</title>
            <rect x="3" y="9" width="18" height="4" rx="1" />
            <path d="M5 13v5m14-5v5M3 9V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2" />
          </svg>
        );
      case "console":
        return (
          <svg viewBox="0 0 24 24">
            <title>Console Table Icon</title>
            <path d="M3 8h18M6 8v9m12-9v9M3 8V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2" />
          </svg>
        );
      case "rug":
        return (
          <svg viewBox="0 0 24 24">
            <title>Rug Icon</title>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 9h18M3 15h18M9 5v14m6-14v14" />
          </svg>
        );
    }
  };

  return (
    <div
      data-content-padding="false"
      className={`${dmSans.variable} ${fraunces.variable} bg-card proposal-page-container min-h-screen w-full`}>
      {activeId && <style>{`* { cursor: grabbing !important; }`}</style>}
      <style>{`
        .proposal-page-container {
          
          --surface: #ffffff;
          --surface-2: #f2efe9;
          --border: rgba(60,50,40,0.1);
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
          --sans: var(--font-dm-sans), sans-serif;
          --serif: var(--font-fraunces), serif;
          
          font-family: var(--sans);
          background: var(--bg);
          color: var(--text-primary);
          padding: 48px 60px;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Header ── */
        .proposal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
        }

        .brand-mark {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .brand-icon svg {
          width: 30px;
          height: 30px;
          fill: var(--text-primary);
        }

        .brand-name {
          font-family: var(--sans);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .brand-sub {
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          font-weight: 300;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: auto auto;
          gap: 3px 32px;
          text-align: right;
        }

        .meta-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          text-align: left;
        }

        .meta-value {
          font-size: 12px;
          font-weight: 400;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }

        .meta-value.strong {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 12px;
        }

        .meta-divider {
          grid-column: 1 / -1;
          height: 0.5px;
          background: var(--border-strong);
          margin: 6px 0;
        }

        /* ── Room Section ── */
        .room-section {
          background: var(--surface);
          border-radius: 16px;
          overflow: hidden;
          border: 0.5px solid var(--border);
        }

        .room-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 36px;
          border-bottom: 0.5px solid var(--border);
        }

        .room-title-group {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .room-title {
          font-family: var(--serif);
          font-style: italic;
          font-weight: 300;
          font-size: 26px;
          letter-spacing: -0.01em;
        }

        .room-dims {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 300;
        }

        /* ── Table ── */
        .proposal-table {
          width: 100%;
          border-collapse: collapse;
        }

        .proposal-table thead tr {
          border-bottom: 0.5px solid var(--border);
        }

        .proposal-table th {
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 14px 16px;
          text-align: left;
          white-space: nowrap;
        }

        .proposal-table th.r { text-align: right; }

        .proposal-table tbody tr {
          border-bottom: 0.5px solid var(--border);
          transition: background 0.12s ease, opacity 0.2s ease;
        }

        .proposal-table tbody tr:last-child { border-bottom: none; }

        .proposal-table tbody tr:hover { background: #faf8f5; }

        .proposal-table td {
          padding: 20px 16px;
          vertical-align: middle;
        }

        /* Thumbnail */
        .thumb {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          background: var(--surface-2);
          border: 0.5px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;
        }

        .thumb svg {
          width: 22px;
          height: 22px;
          stroke: var(--text-tertiary);
          fill: none;
          stroke-width: 1.3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* Item cell */
        .item-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .item-name {
          font-family: var(--serif);
          font-weight: 300;
          font-size: 15px;
          letter-spacing: 0.005em;
          margin-bottom: 3px;
        }



        /* Room label */
        .room-tag {
          font-size: 11px;
          color: var(--text-tertiary);
          white-space: nowrap;
        }



        /* Status */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 20px;
          background: var(--warning-bg);
          color: var(--warning-text);
          border: 0.5px solid var(--warning-border);
          white-space: nowrap;
        }

        .status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--warning-text);
          opacity: 0.6;
        }

        /* Dims + numerics */
        .dim {
          font-size: 12px;
          font-variant-numeric: tabular-nums;
          text-align: right;
          white-space: nowrap;
        }

        .price {
          font-size: 13px;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
          text-align: right;
          white-space: nowrap;
        }

        .total {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          text-align: right;
          white-space: nowrap;
        }

        /* ── Footer ── */
        .table-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 48px;
          padding: 24px 36px;
          background: var(--surface-2);
        }



        .footer-label {
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 4px;
        }

        .footer-value {
          font-family: var(--serif);
          font-weight: 300;
          font-size: 22px;
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

        .footer-value.muted {
          color: var(--text-tertiary);
        }

        .footer-divider {
          width: 0.5px;
          height: 36px;
          background: var(--border-strong);
        }

        /* ── Stagger animation ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .proposal-header { animation: fadeUp 0.4s ease both; }
        .room-section    { animation: fadeUp 0.5s 0.1s ease both; }
      `}</style>

      {/* Header */}
      <header className="proposal-header">
        <div className="brand-mark">
          <div className="brand-icon">
            <Image
              src="/logo_sdg-S-only.svg"
              alt="Logo"
              width={54}
              height={54}
              className="dark:invert"
            />
          </div>
          <div className="brand-name">Sarvian Design Group</div>
          <div className="brand-sub">Design &amp; Architecture</div>
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
          <Button onClick={() => openAddDialog()} variant="default">
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
              onAddItem={openAddDialog}
              renderIcon={renderIcon}
            />
          ))}
        </div>
      )}

      {/* Add Line Item Dialog Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleAddItem} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Add Line Item</DialogTitle>
              <DialogDescription>
                Specify the item properties, pricing, and visual category icon
                to append it to the current room.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="item-name">Item Name *</Label>
                <Input
                  id="item-name"
                  placeholder="e.g. Sofa, Armchair, Dining Table"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-sub">Model / Subtext</Label>
                <Input
                  id="item-sub"
                  placeholder="e.g. Gregory Sectional"
                  value={newItem.subText}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, subText: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-materials">Materials</Label>
                <Input
                  id="item-materials"
                  placeholder="e.g. Cream Leather & Brass"
                  value={newItem.materials}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      materials: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-color">Color</Label>
                <Input
                  id="item-color"
                  placeholder="e.g. Cream / Taupe"
                  value={newItem.color}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-icon">Icon Style</Label>
                <Select
                  value={newItem.iconType}
                  onValueChange={(val) =>
                    setNewItem((prev) => ({
                      ...prev,
                      iconType: val as any,
                    }))
                  }>
                  <SelectTrigger id="item-icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sofa">Sofa</SelectItem>
                    <SelectItem value="armchair">Armchair</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="console">Console Table</SelectItem>
                    <SelectItem value="rug">Rug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-room">Room Location</Label>
                <Input
                  id="item-room"
                  value={newItem.room}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, room: e.target.value }))
                  }
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="item-desc">Notes &amp; Description</Label>
                <Textarea
                  id="item-desc"
                  placeholder="Additional details about the finish, fabric, or other spec notes..."
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="min-h-[60px]"
                />
              </div>

              {/* Physical specifications */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-dimensions">Dimensions</Label>
                <Input
                  id="item-dimensions"
                  placeholder={`e.g. 168″ × 77″ × 35″`}
                  value={newItem.dimensions}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      dimensions: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-qty">Qty</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min="1"
                  value={newItem.qty}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      qty: Math.max(1, Number(e.target.value)),
                    }))
                  }
                />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="item-price">Unit Price ($) *</Label>
                <Input
                  id="item-price"
                  type="text"
                  placeholder="0.00"
                  value={newItem.price}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9.]/g, "");
                    setNewItem((prev) => ({ ...prev, price: clean }));
                  }}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
