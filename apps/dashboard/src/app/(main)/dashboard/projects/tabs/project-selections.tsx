"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { DollarSign, FolderPlus, Home, LayoutGrid, Loader2, PlusCircle, ShoppingBag } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { useAuth } from "@/components/auth-context";
import { DashboardImage } from "@/components/dashboard-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addProjectRoom, getLibraryItems, getVendors, seedMockRooms } from "@/lib/db";
import { db } from "@/lib/firebase";
import type { LibraryItem, Project, ProjectRoom, ProjectRoomItem, Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { AddItemsDialog } from "./_tab_components/add-items-dialog";

// ----------------------------------------------------
// Validation Schemas
// ----------------------------------------------------
const roomSchema = z.object({
  name: z.string().min(1, "Room name is required."),
  description: z.string().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

// ----------------------------------------------------
// Component Props
// ----------------------------------------------------
interface ProjectSelectionsProps {
  project: Project;
}

export function ProjectSelections({ project }: ProjectSelectionsProps) {
  const { profile, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<ProjectRoom[]>([]);
  const [roomItems, setRoomItems] = useState<ProjectRoomItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Dialog States
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [activeRoomForAddItems, setActiveRoomForAddItems] = useState<ProjectRoom | null>(null);

  // Form setups
  const roomForm = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema) as any,
    defaultValues: { name: "", description: "" },
  });

  const isSeeding = useRef(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    const orgId = profile.organizationId;

    let unsubscribed = false;

    // Load global catalog data once
    async function initData() {
      try {
        const [libItemsData, vendorsData] = await Promise.all([getLibraryItems(orgId), getVendors(orgId)]);
        if (unsubscribed) return;
        setLibraryItems(libItemsData);
        setVendors(vendorsData);
      } catch (error) {
        console.error("Error loading initial catalog data:", error);
      }
    }
    void initData();

    // Set up snapshot listener for rooms
    const roomsQuery = query(collection(db, "projectRooms"), where("projectId", "==", project.projectId));
    const unsubscribeRooms = onSnapshot(
      roomsQuery,
      (snapshot) => {
        if (unsubscribed) return;
        const roomsData: ProjectRoom[] = [];
        snapshot.forEach((docSnap) => {
          roomsData.push(docSnap.data() as ProjectRoom);
        });

        if (roomsData.length === 0 && !isSeeding.current) {
          isSeeding.current = true;
          seedMockRooms(project.projectId, orgId)
            .catch((err) => console.error("Error seeding:", err))
            .finally(() => {
              isSeeding.current = false;
            });
          return;
        }

        setRooms(roomsData.sort((a, b) => a.createdAt - b.createdAt));
        setLoading(false);
      },
      (error) => {
        console.error("Rooms snapshot error:", error);
        setLoading(false);
      },
    );

    // Set up snapshot listener for room items
    const itemsQuery = query(collection(db, "projectRoomItems"), where("projectId", "==", project.projectId));
    const unsubscribeItems = onSnapshot(
      itemsQuery,
      (snapshot) => {
        if (unsubscribed) return;
        const itemsData: ProjectRoomItem[] = [];
        snapshot.forEach((docSnap) => {
          itemsData.push(docSnap.data() as ProjectRoomItem);
        });
        setRoomItems(itemsData.sort((a, b) => a.updatedAt - b.updatedAt));
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
  }, [project.projectId, profile, authLoading]);

  // Handle Room submission
  const onSubmitRoom = async (data: RoomFormData) => {
    if (!profile) return;
    startTransition(async () => {
      try {
        const newRoom = await addProjectRoom({
          projectId: project.projectId,
          name: data.name,
          description: data.description,
        });
        toast.success(`"${newRoom.name}" created!`);
        roomForm.reset();
        setIsRoomDialogOpen(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to create room.");
      }
    });
  };

  const handleItemAdded = () => {
    // Handled in snapshot listener
  };

  // Calculations for total quantities and values
  const totalItemCount = roomItems.length;
  const totalSelectedValue = roomItems.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);
  const totalCostValue = roomItems.reduce((acc, item) => acc + (item.unitCost ?? 0) * item.quantity, 0);
  const budgetRemaining = (project.budget ?? 0) - totalSelectedValue;

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Retrieving Selections Setup
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in flex w-full animate-in flex-col gap-6 duration-300">
      {/* Banner / Stat Bar */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">Total Sections</CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-xl text-foreground">
              <Home className="icons" />
              {rooms.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">Total Items</CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-xl text-foreground">
              <ShoppingBag className="icons" />
              {totalItemCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-0">
            <CardDescription className="text-xs uppercase tracking-wider">Budget</CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-xl text-foreground">
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
            <CardDescription className="text-xs uppercase tracking-wider">Budget Remaining</CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-xl text-foreground">
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
            <CardDescription className="text-xs uppercase tracking-wider">Total Cost</CardDescription>
            <CardTitle className="mt-1 flex items-center gap-2 text-xl text-foreground">
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
            <CardDescription className="text-primary text-xs uppercase tracking-wider">Total Retail</CardDescription>
            <CardTitle className="mt-1 text-xl text-primary">
              <DollarSign className="icons" />
              {formatCurrency(totalSelectedValue, {
                noDecimals: true,
                noSymbol: true,
              })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Grid of Rooms */}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
        {rooms.map((room) => {
          const itemsInRoom = roomItems.filter((item) => item.roomId === room.roomId);
          return (
            <Card key={room.roomId} className="flex h-full flex-col pt-0">
              <CardHeader className="border-b bg-muted/50 pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      <LayoutGrid className="icons" />
                      {room.name}
                    </CardTitle>
                    {room.description && (
                      <CardDescription className="mt-1 line-clamp-2 ml-6.5">{room.description}</CardDescription>
                    )}
                  </div>

                  <Button onClick={() => setActiveRoomForAddItems(room)} variant="secondary" size="icon">
                    <PlusCircle className="size-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Items List Inside Room */}
              <CardContent className="max-h-[850px] min-h-[600px] flex-1 overflow-y-auto p-0">
                {itemsInRoom.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center text-muted-foreground">
                    <ShoppingBag className="mb-2 size-8 text-muted-foreground/30" />
                    <p className="font-medium text-xs">No items in section yet.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {itemsInRoom.map((item) => {
                      const parentVendor = vendors.find((v) => v.vendorId === item.vendorId);
                      return (
                        <div
                          key={item.roomItemId}
                          className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/20"
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
                            <h4 className="truncate font-semibold text-foreground text-sm">{item.name}</h4>
                            <div className="mt-0.5 flex items-center gap-1.5 truncate text-muted-foreground text-xs">
                              {parentVendor && (
                                <span className="truncate font-medium text-foreground/75">{parentVendor.name}</span>
                              )}
                              {parentVendor && item.sku && <span>•</span>}
                              {item.sku && <span className="truncate font-mono">{item.sku}</span>}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs">
                              <span className="font-semibold text-primary">{formatCurrency(item.sellingPrice)}</span>
                              <span className="text-muted-foreground/80">Qty: {item.quantity}</span>
                            </div>
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
                    itemsInRoom.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0),
                    { noDecimals: true },
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}

        {/* Create Room Box trigger */}
        <Card
          onClick={() => setIsRoomDialogOpen(true)}
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

      {/* ---------------------------------------------------- */}
      {/* Create Room Dialog */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Create New Section</DialogTitle>
            <DialogDescription>Assign a section to organize specific items and services.</DialogDescription>
          </DialogHeader>
          <form onSubmit={roomForm.handleSubmit(onSubmitRoom)} className="space-y-4">
            <Controller
              control={roomForm.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label htmlFor="room-name">
                    Section Name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="room-name" placeholder="e.g. Living Room, Dining Room" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={roomForm.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label htmlFor="room-description">Description (Optional)</Label>
                  <Textarea
                    id="room-description"
                    placeholder="e.g. Modern airy styling with custom flooring specifications."
                    className="min-h-[80px] resize-none"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Create Section
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
    </div>
  );
}
