"use client";

import { useEffect, useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { VisibilityState } from "@tanstack/react-table";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  DollarSign,
  Edit,
  FolderPlus,
  Home,
  LayoutGrid,
  Loader2,
  Columns3,
  MoreVertical,
  Pencil,
  PlusCircle,
  Rows3,
  ShoppingBag,
  Trash2,
  Grid,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { useAuth } from "@/components/auth-context";
import { DashboardImage } from "@/components/dashboard-image";
import { FadeIn } from "@/components/fade-in";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipDropdownMenu,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addProjectRoom,
  deleteProjectRoomItem,
  getLibraryItems,
  getVendors,
  reorderProjectRoomItems,
  updateProjectRoom,
} from "@/lib/db";
import { db } from "@/lib/firebase";
import type {
  LibraryItem,
  Project,
  ProjectRoom,
  ProjectRoomItem,
  Vendor,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { AddItemsDialog } from "./_tab_components/add-items-dialog";
import { EditItemDialog } from "./_tab_components/edit-item-dialog";
import {
  DEFAULT_ITEM_COLUMN_VISIBILITY,
  ITEM_COLUMN_OPTIONS,
  ItemsTable,
} from "./_tab_components/items-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ----------------------------------------------------
// Validation Schemas
// ----------------------------------------------------
const roomSchema = z.object({
  name: z.string().min(1, "Room name is required."),
  description: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

// ----------------------------------------------------
// List View — one table per section (mirrors the proposal layout)
// ----------------------------------------------------

interface RoomListCardProps {
  room: ProjectRoom;
  items: ProjectRoomItem[];
  vendors: Vendor[];
  visibleColumns: VisibilityState;
  onEdit: (room: ProjectRoom) => void;
  onAddItem: (room: ProjectRoom) => void;
  onEditItem: (item: ProjectRoomItem) => void;
  onDeleteItem: (item: ProjectRoomItem) => void;
  onReorder: (orderedIds: string[]) => void;
}

function RoomListCard({
  room,
  items,
  vendors,
  visibleColumns,
  onEdit,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorder,
}: RoomListCardProps) {
  const subtotal = items.reduce(
    (acc, item) => acc + item.sellingPrice * item.quantity,
    0,
  );

  return (
    <Card variant="panel">
      <CardHeader>
        <div>
          <CardTitle>
            <LayoutGrid className="icons" />
            {room.name}
          </CardTitle>
          {room.description && (
            <CardDescription className="mt-0.5 ml-6.5 line-clamp-2 font-light text-xs">
              {room.description}
            </CardDescription>
          )}
        </div>
        <TooltipDropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="size-4" />
              <span className="sr-only">Section actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(room)}>
              <Edit className="size-4" />
              Edit Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddItem(room)}>
              <PlusCircle className="size-4" />
              Add Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </TooltipDropdownMenu>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-muted-foreground">
            <ShoppingBag className="mb-2 size-8 text-muted-foreground/30" />
            <p className="font-medium text-xs">No items in section yet.</p>
          </div>
        ) : (
          <ItemsTable
            items={items}
            vendors={vendors}
            columnVisibility={visibleColumns}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onReorder={onReorder}
          />
        )}
      </CardContent>

      <CardFooter className="flex shrink-0 items-center justify-end gap-12 border-t p-4">
        <div className="flex flex-col items-center gap-1 text-xl">
          <Label>Items</Label>
          {items.length}
        </div>
        <div className="flex flex-col items-center gap-1 text-xl">
          <Label>Section Total</Label>
          {formatCurrency(subtotal, { noDecimals: true })}
        </div>
      </CardFooter>
    </Card>
  );
}

// ----------------------------------------------------
// Component Props
// ----------------------------------------------------
interface ProjectItemsProps {
  project: Project;
}

export function ProjectItems({ project }: ProjectItemsProps) {
  const { profile, organizationId, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<ProjectRoom[]>([]);
  const [roomItems, setRoomItems] = useState<ProjectRoomItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_ITEM_COLUMN_VISIBILITY,
  );

  // Dialog States
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  // When set, the room dialog edits this room; otherwise it creates a new one.
  const [editingRoom, setEditingRoom] = useState<ProjectRoom | null>(null);
  const [activeRoomForAddItems, setActiveRoomForAddItems] =
    useState<ProjectRoom | null>(null);
  const [editingItem, setEditingItem] = useState<ProjectRoomItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ProjectRoomItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Form setups
  const roomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const id = organizationId; // stable string dependency; profile object identity churns on each heartbeat

    let unsubscribed = false;

    // Load global catalog data once
    async function initData() {
      try {
        const [libItemsData, vendorsData] = await Promise.all([
          getLibraryItems(id),
          getVendors(id),
        ]);
        if (unsubscribed) return;
        setLibraryItems(libItemsData);
        setVendors(vendorsData);
      } catch (error) {
        console.error("Error loading initial catalog data:", error);
      }
    }
    void initData();

    // Set up snapshot listener for rooms
    const roomsQuery = query(
      collection(db, "projectRooms"),
      where("projectId", "==", project.projectId),
    );
    const unsubscribeRooms = onSnapshot(
      roomsQuery,
      (snapshot) => {
        if (unsubscribed) return;
        const roomsData: ProjectRoom[] = [];
        snapshot.forEach((docSnap) => {
          roomsData.push(docSnap.data() as ProjectRoom);
        });

        setRooms(roomsData.sort((a, b) => a.createdAt - b.createdAt));
        setLoading(false);
      },
      (error) => {
        console.error("Rooms snapshot error:", error);
        setLoading(false);
      },
    );

    // Set up snapshot listener for room items
    const itemsQuery = query(
      collection(db, "projectRoomItems"),
      where("projectId", "==", project.projectId),
    );
    const unsubscribeItems = onSnapshot(
      itemsQuery,
      (snapshot) => {
        if (unsubscribed) return;
        const itemsData: ProjectRoomItem[] = [];
        snapshot.forEach((docSnap) => {
          itemsData.push(docSnap.data() as ProjectRoomItem);
        });
        setRoomItems(
          itemsData.sort(
            (a, b) =>
              (a.sortOrder ?? a.createdAt) - (b.sortOrder ?? b.createdAt),
          ),
        );
      },
      (error) => {
        console.error("Items snapshot error:", error);
      },
    );

    return () => {
      unsubscribed = true;
      unsubscribeRooms();
      unsubscribeItems();
    };
  }, [project.projectId, organizationId, authLoading]);

  // Open the dialog in create mode (blank form).
  const openCreateRoom = () => {
    setEditingRoom(null);
    roomForm.reset({ name: "", description: "" });
    setIsRoomDialogOpen(true);
  };

  // Open the dialog in edit mode, prefilled with the room's current values.
  const openEditRoom = (room: ProjectRoom) => {
    setEditingRoom(room);
    roomForm.reset({ name: room.name, description: room.description ?? "" });
    setIsRoomDialogOpen(true);
  };

  // Handle Room submission — creates a new room or updates the one being edited.
  const onSubmitRoom = async (data: RoomFormData) => {
    if (!profile) return;
    startTransition(async () => {
      try {
        if (editingRoom) {
          await updateProjectRoom(editingRoom.roomId, {
            name: data.name,
            description: data.description,
          });
          toast.success(`"${data.name}" updated!`);
        } else {
          const newRoom = await addProjectRoom({
            projectId: project.projectId,
            name: data.name,
            description: data.description,
          });
          toast.success(`"${newRoom.name}" created!`);
        }
        roomForm.reset();
        setIsRoomDialogOpen(false);
        setEditingRoom(null);
      } catch (error) {
        console.error(error);
        toast.error(
          editingRoom
            ? "Failed to update section."
            : "Failed to create section.",
        );
      }
    });
  };

  const handleItemAdded = () => {
    // Handled in snapshot listener
  };

  // Persist a section's new drag order. We optimistically renumber the affected
  // items so the row doesn't flash back before the snapshot catches up.
  const handleReorderItems = (orderedIds: string[]) => {
    const orderById = new Map(orderedIds.map((id, index) => [id, index]));
    setRoomItems((prev) =>
      [...prev]
        .map((item) =>
          orderById.has(item.roomItemId)
            ? { ...item, sortOrder: orderById.get(item.roomItemId) }
            : item,
        )
        .sort(
          (a, b) => (a.sortOrder ?? a.createdAt) - (b.sortOrder ?? b.createdAt),
        ),
    );
    void reorderProjectRoomItems(
      orderedIds.map((roomItemId, index) => ({ roomItemId, sortOrder: index })),
    ).catch((error) => {
      console.error(error);
      toast.error("Failed to save the new order.");
    });
  };

  // Delete the confirmed item; the snapshot listener removes it from state.
  const handleConfirmDeleteItem = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteProjectRoomItem(deletingItem.roomItemId);
      toast.success(`"${deletingItem.name}" removed.`);
      setDeletingItem(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculations for total quantities and values
  const totalItemCount = roomItems.length;
  const totalSelectedValue = roomItems.reduce(
    (acc, item) => acc + item.sellingPrice * item.quantity,
    0,
  );
  const totalCostValue = roomItems.reduce(
    (acc, item) => acc + (item.unitCost ?? 0) * item.quantity,
    0,
  );
  const budgetRemaining = (project.budget ?? 0) - totalSelectedValue;

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Retrieving Items Setup
        </p>
      </div>
    );
  }

  return (
    <FadeIn className="flex w-full flex-col gap-6">
      {/* Banner / Stat Bar */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Sections
            </CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-foreground text-xl">
              <Home className="icons" />
              {rooms.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Items
            </CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-foreground text-xl">
              <ShoppingBag className="icons" />
              {totalItemCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">
              Budget
            </CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-foreground text-xl">
              <DollarSign className="icons" />
              {project.budget
                ? formatCurrency(project.budget, {
                    noDecimals: true,
                    noSymbol: true,
                  })
                : "0"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">
              Budget Remaining
            </CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-foreground text-xl">
              <DollarSign className="icons" />
              {formatCurrency(budgetRemaining, {
                noDecimals: true,
                noSymbol: true,
              })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">
              Total Cost
            </CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-foreground text-xl">
              <DollarSign className="icons" />
              {formatCurrency(totalCostValue, {
                noDecimals: true,
                noSymbol: true,
              })}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary bg-linear-to-br from-primary/5 to-primary/15">
          <CardHeader className="py-0">
            <CardDescription className="text-primary text-xs uppercase tracking-wider">
              Total Retail
            </CardDescription>
            <CardTitle className="mt-1 text-primary text-xl">
              <DollarSign className="icons" />
              {formatCurrency(totalSelectedValue, {
                noDecimals: true,
                noSymbol: true,
              })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="flex items-center justify-end gap-2">
        {view === "list" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 className="size-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-96 w-52 overflow-y-auto"
            >
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ITEM_COLUMN_OPTIONS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={columnVisibility[col.id]}
                  onCheckedChange={(checked) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      [col.id]: !!checked,
                    }))
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as "grid" | "list")}
        >
          <TabsList>
            <TabsTrigger value="grid" aria-label="Grid view">
              <Grid />
            </TabsTrigger>
            <TabsTrigger value="list" aria-label="List view">
              <Rows3 />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid of Rooms */}
      {view === "grid" && (
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {rooms.map((room) => {
            const itemsInRoom = roomItems.filter(
              (item) => item.roomId === room.roomId,
            );
            return (
              <Card variant="panel" key={room.roomId}>
                <CardHeader className="h-20!">
                  <div>
                    <CardTitle>
                      <LayoutGrid className="icons" />
                      {room.name}
                    </CardTitle>
                    {room.description && (
                      <CardDescription className="mt-0.5 font-light text-xs ml-6.5 line-clamp-2">
                        {room.description}
                      </CardDescription>
                    )}
                  </div>
                  <TooltipDropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="size-4" />
                        <span className="sr-only">Section actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEditRoom(room)}>
                        <Edit className="size-4" />
                        Edit Section
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setActiveRoomForAddItems(room)}
                      >
                        <PlusCircle className="size-4" />
                        Add Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </TooltipDropdownMenu>
                </CardHeader>

                {/* Items List Inside Room */}
                <CardContent className="max-h-[850px] min-h-[600px] flex-1 overflow-y-auto p-0">
                  {itemsInRoom.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-muted-foreground">
                      <ShoppingBag className="mb-2 size-8 text-muted-foreground/30" />
                      <p className="font-medium text-xs">
                        No items in section yet.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {itemsInRoom.map((item) => {
                        const parentVendor = vendors.find(
                          (v) => v.vendorId === item.vendorId,
                        );
                        return (
                          <div
                            key={item.roomItemId}
                            className="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/20"
                          >
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
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-semibold text-foreground text-sm">
                                {item.name}
                              </h4>
                              <div className="mt-0.5 flex items-center gap-1.5 truncate text-muted-foreground text-xs">
                                {parentVendor && (
                                  <span className="truncate font-medium text-foreground/75">
                                    {parentVendor.name}
                                  </span>
                                )}
                                {parentVendor && item.sku && <span>•</span>}
                                {item.sku && (
                                  <span className="truncate font-mono">
                                    {item.sku}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="font-semibold text-primary">
                                  {formatCurrency(item.sellingPrice)}
                                </span>
                                <span className="text-muted-foreground/80">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setEditingItem(item)}
                              >
                                <Pencil className="size-4" />
                                <span className="sr-only">Edit item</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeletingItem(item)}
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete item</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>

                {/* Actions Footer */}
                <CardFooter className="flex shrink-0 items-center justify-around border-t p-4">
                  <div className="flex flex-col items-center gap-2 text-xl">
                    <Label>Items</Label>
                    {itemsInRoom.length}
                  </div>
                  <div className="flex flex-col items-center gap-2 text-xl">
                    <Label>Section Total</Label>
                    {formatCurrency(
                      itemsInRoom.reduce(
                        (acc, item) => acc + item.sellingPrice * item.quantity,
                        0,
                      ),
                      { noDecimals: true },
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}

          {/* Create Room Box trigger */}
          <Card
            onClick={openCreateRoom}
            className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center border-dashed p-8 text-center transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="mb-3 flex size-12 items-center justify-center rounded-full border border-dashed text-muted-foreground transition-colors group-hover:border-primary/50 group-hover:text-primary">
              <FolderPlus className="size-6" />
            </div>
            <h3 className="font-semibold text-base text-foreground transition-colors group-hover:text-primary">
              Create Section
            </h3>
          </Card>
        </div>
      )}

      {/* List View — one table per section */}
      {view === "list" && (
        <div className="flex flex-col gap-6">
          {rooms.map((room) => (
            <RoomListCard
              key={room.roomId}
              room={room}
              items={roomItems.filter((item) => item.roomId === room.roomId)}
              vendors={vendors}
              visibleColumns={columnVisibility}
              onEdit={openEditRoom}
              onAddItem={setActiveRoomForAddItems}
              onEditItem={setEditingItem}
              onDeleteItem={setDeletingItem}
              onReorder={handleReorderItems}
            />
          ))}
          <Button
            variant="outline"
            onClick={openCreateRoom}
            className="w-fit gap-2 self-start"
          >
            <FolderPlus className="size-4" />
            Create Section
          </Button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Create Room Dialog */}
      {/* ---------------------------------------------------- */}
      <Dialog
        open={isRoomDialogOpen}
        onOpenChange={(open) => {
          setIsRoomDialogOpen(open);
          if (!open) setEditingRoom(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingRoom ? "Edit Section" : "Create New Section"}
            </DialogTitle>
            <DialogDescription>
              Assign a section to organize specific items and services.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={roomForm.handleSubmit(onSubmitRoom)}
            className="space-y-4"
          >
            <Controller
              control={roomForm.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field
                  className="flex flex-col gap-1.5"
                  data-invalid={fieldState.invalid}
                >
                  <Label htmlFor="room-name">
                    Section Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="room-name"
                    placeholder="e.g. Living Room, Dining Room"
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={roomForm.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field
                  className="flex flex-col gap-1.5"
                  data-invalid={fieldState.invalid}
                >
                  <Label htmlFor="room-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="room-description"
                    placeholder="e.g. Modern airy styling with custom flooring specifications."
                    className="min-h-[80px] resize-none"
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRoomDialogOpen(false);
                  setEditingRoom(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                )}
                {editingRoom ? "Save Changes" : "Create Section"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* Add Items Dialog (Tabs: Catalog vs Custom) */}
      {/* ---------------------------------------------------- */}
      {activeRoomForAddItems && (
        <AddItemsDialog
          room={activeRoomForAddItems}
          projectId={project.projectId}
          organizationId={profile?.organizationId || ""}
          libraryItems={libraryItems}
          vendors={vendors}
          open={!!activeRoomForAddItems}
          onOpenChange={(open) => {
            if (!open) setActiveRoomForAddItems(null);
          }}
          onItemAdded={handleItemAdded}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* Edit Item Dialog */}
      {/* ---------------------------------------------------- */}
      {editingItem && (
        <EditItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* Delete Item Confirmation */}
      {/* ---------------------------------------------------- */}
      <AlertDialog
        open={!!deletingItem}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
      >
        <AlertDialogContent className="bg-popover sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingItem?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this item from the section. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDeleteItem}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FadeIn>
  );
}
