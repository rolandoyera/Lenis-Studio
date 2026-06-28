"use client";
"use no memo";

import * as React from "react";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/page-header";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { format } from "date-fns";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Grid, Plus, Rows3, Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { PageTitle } from "@/components/page-title-updater";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { db } from "@/lib/firebase";
import { inviteUser } from "@/server/invite-actions";

import { filters, type UserRow } from "./data";
import { addUserSchema, type AddUserFormData } from "./user-schema";
import { usersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

export function Users({ users: _fallbackUsers }: { users?: UserRow[] }) {
  const {
    user,
    profile,
    uid,
    organizationId,
    role,
    loading: authLoading,
  } = useAuth();
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
    if (isSubmitting || !profile || !user) return;

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
      const authToken = await user.getIdToken();
      await inviteUser({
        authToken,
        fullName: trimmedName,
        email: trimmedEmail,
        role: data.role,
      });

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
    if (authLoading) return;
    if (!uid) {
      router.push("/auth/login");
      return;
    }
    if (role !== "Admin" && role !== "SuperAdmin") {
      toast.error("Access denied. Administrator privileges required.");
      router.push("/dashboard/home");
    }
  }, [uid, role, authLoading, router]);

  React.useEffect(() => {
    if (authLoading || !organizationId) return;

    const q = query(
      collection(db, "users"),
      where("organizationId", "==", organizationId),
    );
    const unsubscribe = onSnapshot(
      q,
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
  }, [organizationId, authLoading]);

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
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    <div className="flex w-full flex-col gap-6">
      <PageTitle title="Users" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Users"
          description="Manage your organization members and their access."
        />
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus /> User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form
              onSubmit={form.handleSubmit(handleAddUser)}
              className="contents"
            >
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
                      data-invalid={fieldState.invalid}
                    >
                      <FieldLabel htmlFor="add-fullName">Full Name</FieldLabel>
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
                      data-invalid={fieldState.invalid}
                    >
                      <FieldLabel htmlFor="add-email">Email Address</FieldLabel>
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
                      data-invalid={fieldState.invalid}
                    >
                      <FieldLabel htmlFor="add-role">Role</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
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
                    disabled={isSubmitting}
                  >
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
      </div>
      <div className="flex items-center justify-end">
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

      <Card variant="panel" className="gap-0">
        <CardHeader>
          <CardTitle className="sr-only">Users</CardTitle>
          <CardDescription className="sr-only">
            Manage your organization members and their access.
          </CardDescription>
          <div className="flex w-full flex-wrap items-center justify-between">
            <div className="text-sm tabular-nums">{selectedCount} selected</div>

            <div className="hidden md:flex items-center gap-4">
              <Select
                value={roleFilter}
                onValueChange={(value) => setColumnSelectFilter("role", value)}
              >
                <SelectTrigger>
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
                onValueChange={(value) =>
                  setColumnSelectFilter("status", value)
                }
              >
                <SelectTrigger>
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
              <InputGroup className="w-full md:w-64">
                <InputGroupAddon align="inline-start">
                  <Search className="size-3.5" />
                </InputGroupAddon>
                <InputGroupInput
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pt-0">
          <UsersTable table={table} />
        </CardContent>
      </Card>
    </div>
  );
}
