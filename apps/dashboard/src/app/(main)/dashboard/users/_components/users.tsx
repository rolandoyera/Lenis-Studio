"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Grid, Plus, Rows3, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

import { filters, type UserRow } from "./data";
import { usersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

const addUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "Please enter a full name.")
    .max(100, "Name is too long."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["Admin", "Contributor"]),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

export function Users({ users: fallbackUsers }: { users: UserRow[] }) {
  const [dbUsers, setDbUsers] = React.useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  // Form states for Add User modal
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "Contributor",
    },
  });

  // Reset form fields and errors when dialog is closed
  React.useEffect(() => {
    if (!isAddOpen) {
      form.reset();
    }
  }, [isAddOpen, form.reset]);

  const handleAddUser = async (data: AddUserFormData) => {
    if (isSubmitting) return;

    const trimmedName = data.fullName.trim();
    const trimmedEmail = data.email.trim().toLowerCase();

    const userExists = dbUsers.some(
      (u) => u.email.toLowerCase() === trimmedEmail,
    );
    if (userExists) {
      toast.error("A user with this email address already exists.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userDocRef = doc(db, "users", trimmedEmail);
      await setDoc(userDocRef, {
        fullName: trimmedName,
        email: trimmedEmail,
        role: data.role,
        status: "Pending",
        joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
        lastActive: 0,
      });

      // Write a mail document to trigger an invitation email via the Firebase Trigger Email extension
      try {
        await addDoc(collection(db, "mail"), {
          to: trimmedEmail,
          message: {
            subject: "You've been added to Weblabs Studio Dashboard!",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome, ${trimmedName}!</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.5;">
                  You have been added to the organization dashboard as an <strong>${data.role}</strong>.
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  Click the button below to sign in and activate your account:
                </p>
                <a href="${window.location.origin}/auth/invite?email=${trimmedEmail}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Set Up Account & Get Started
                </a>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                  Weblabs Studio Dashboard invitation. If you did not expect this, please ignore this email.
                </p>
              </div>
            `,
          },
        });
      } catch (emailError) {
        console.error(
          "Failed to write to mail collection for Trigger Email:",
          emailError,
        );
      }

      toast.success("User added successfully!");
      form.reset();
      setIsAddOpen(false);
    } catch (error) {
      console.error("Error adding user to Firestore:", error);
      toast.error("Failed to add user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const role = userDocSnap.data().role;
            if (role !== "Admin") {
              toast.error("Access denied. Administrator privileges required.");
              router.push("/dashboard/default");
            }
          } else {
            toast.error("Access denied. Administrator privileges required.");
            router.push("/dashboard/default");
          }
        } catch (e) {
          console.error("Auth protection verify error:", e);
          router.push("/dashboard/default");
        }
      } else {
        router.push("/auth/login");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          let joinedDateStr = format(new Date(), "dd MMM yyyy, h:mm a");
          if (data.joinedDate) {
            joinedDateStr = data.joinedDate;
          } else if (data.updatedAt) {
            try {
              joinedDateStr = format(
                new Date(data.updatedAt),
                "dd MMM yyyy, h:mm a",
              );
            } catch (e) {
              console.error("Date format error:", e);
            }
          }

          return {
            uid: doc.id,
            email: data.email || "",
            name:
              data.fullName ||
              data.displayName ||
              data.email?.split("@")[0] ||
              "User",
            role: data.role || "Contributor",
            status: data.status || "Active",
            joinedDate: joinedDateStr,
            lastActive: data.lastActive || 0,
          } as UserRow;
        });

        setDbUsers(list);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setDbUsers([]);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [fallbackUsers]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "joinedDate", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      search: false,
    });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data: dbUsers,
    columns: usersColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.email,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="relative size-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const searchQuery =
    (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const roleFilter =
    (table.getColumn("role")?.getFilterValue() as string) ?? filters.role[0];
  const statusFilter =
    (table.getColumn("status")?.getFilterValue() as string) ??
    filters.status[0];
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string) {
    table
      .getColumn(columnId)
      ?.setFilterValue(value === "All" ? undefined : value);
    table.setPageIndex(0);
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Users</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          Manage your organization members and their access.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(event) => {
                table
                  .getColumn("search")
                  ?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </InputGroup>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form
                onSubmit={form.handleSubmit(handleAddUser)}
                className="contents">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Invite a new member to your organization. They will show as
                    Pending until they log in for the first time.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <Controller
                    control={form.control}
                    name="fullName"
                    render={({ field, fieldState }) => (
                      <Field
                        className="gap-1.5"
                        data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="add-fullName">
                          Full Name
                        </FieldLabel>
                        <Input
                          {...field}
                          id="add-fullName"
                          disabled={isSubmitting}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <Field
                        className="gap-1.5"
                        data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="add-email">
                          Email Address
                        </FieldLabel>
                        <Input
                          {...field}
                          id="add-email"
                          type="email"
                          disabled={isSubmitting}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="role"
                    render={({ field, fieldState }) => (
                      <Field
                        className="gap-1.5"
                        data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="add-role">Role</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectGroup>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Contributor">
                                Contributor
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={roleFilter}
              onValueChange={(value) => setColumnSelectFilter("role", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Role:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filters.role.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setColumnSelectFilter("status", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Status:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filters.status.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4">
          <div className="text-muted-foreground text-sm tabular-nums">
            {selectedCount} selected
          </div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list" aria-label="List view">
                <Rows3 />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <Grid />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <UsersTable table={table} />
      </CardContent>
    </Card>
  );
}
