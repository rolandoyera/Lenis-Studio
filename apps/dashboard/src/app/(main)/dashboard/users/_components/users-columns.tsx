"use client";
"use no memo";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { parse } from "date-fns";
import { ArrowUpDown } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, getInitials } from "@/lib/utils";

import { statusMeta, type UserRow } from "./data";

function RoleCell({ role }: { role: string }) {
  return <span className="whitespace-nowrap font-medium text-sm">{role}</span>;
}

function StatusBadge({ status }: { status: UserRow["status"] }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}

function getAvatarTone(name: string) {
  const tones = [
    "[&_[data-slot=avatar-fallback]]:bg-amber-100 [&_[data-slot=avatar-fallback]]:text-amber-700 after:border-amber-200 dark:[&_[data-slot=avatar-fallback]]:bg-amber-500/15 dark:[&_[data-slot=avatar-fallback]]:text-amber-300 dark:after:border-amber-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-orange-100 [&_[data-slot=avatar-fallback]]:text-orange-700 after:border-orange-200 dark:[&_[data-slot=avatar-fallback]]:bg-orange-500/15 dark:[&_[data-slot=avatar-fallback]]:text-orange-300 dark:after:border-orange-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-rose-100 [&_[data-slot=avatar-fallback]]:text-rose-700 after:border-rose-200 dark:[&_[data-slot=avatar-fallback]]:bg-rose-500/15 dark:[&_[data-slot=avatar-fallback]]:text-rose-300 dark:after:border-rose-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-pink-100 [&_[data-slot=avatar-fallback]]:text-pink-700 after:border-pink-200 dark:[&_[data-slot=avatar-fallback]]:bg-pink-500/15 dark:[&_[data-slot=avatar-fallback]]:text-pink-300 dark:after:border-pink-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-fuchsia-100 [&_[data-slot=avatar-fallback]]:text-fuchsia-700 after:border-fuchsia-200 dark:[&_[data-slot=avatar-fallback]]:bg-fuchsia-500/15 dark:[&_[data-slot=avatar-fallback]]:text-fuchsia-300 dark:after:border-fuchsia-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-purple-100 [&_[data-slot=avatar-fallback]]:text-purple-700 after:border-purple-200 dark:[&_[data-slot=avatar-fallback]]:bg-purple-500/15 dark:[&_[data-slot=avatar-fallback]]:text-purple-300 dark:after:border-purple-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 after:border-violet-200 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300 dark:after:border-violet-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-indigo-100 [&_[data-slot=avatar-fallback]]:text-indigo-700 after:border-indigo-200 dark:[&_[data-slot=avatar-fallback]]:bg-indigo-500/15 dark:[&_[data-slot=avatar-fallback]]:text-indigo-300 dark:after:border-indigo-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 after:border-sky-200 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300 dark:after:border-sky-500/20",
    "[&_[data-slot=avatar-fallback]]:bg-emerald-100 [&_[data-slot=avatar-fallback]]:text-emerald-700 after:border-emerald-200 dark:[&_[data-slot=avatar-fallback]]:bg-emerald-500/15 dark:[&_[data-slot=avatar-fallback]]:text-emerald-300 dark:after:border-emerald-500/20",
  ];

  return tones[name.length % tones.length];
}

function AvatarCell({ lastActive, name, status }: { lastActive: number; name: string; status: string }) {
  // 1. If administratively Suspended, Locked, or Deactivated, show a solid red dot
  const isPaused = status === "Suspended" || status === "Locked" || status === "Deactivated";

  if (isPaused) {
    return (
      <Avatar size="lg" className={cn("font-medium", getAvatarTone(name))}>
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
        <AvatarBadge className="bg-rose-500 size-2.5 border-none ring-2 ring-background p-0 absolute flex items-center justify-center">
          <span className="size-1.5 rounded-full bg-rose-500" />
        </AvatarBadge>
      </Avatar>
    );
  }

  // 2. Otherwise check active timelines
  const now = Date.now();
  const elapsedMs = lastActive > 0 ? now - lastActive : Infinity;

  // Online if active within the last 30 minutes (handles local clock drift)
  const isOnline = lastActive > 0 && Math.abs(elapsedMs) < 30 * 60 * 1000;

  // Idle if active within the last 1 hour
  const isIdle = lastActive > 0 && !isOnline && Math.abs(elapsedMs) < 60 * 60 * 1000;

  if (isOnline) {
    return (
      <Avatar size="lg" className={cn("font-medium", getAvatarTone(name))}>
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
        <AvatarBadge className="bg-emerald-500 size-2.5 border-none ring-2 ring-background p-0 absolute flex items-center justify-center">
          {/* Core dot */}
          <span className="absolute size-1.5 rounded-full bg-emerald-500" />
          {/* Breathing ping layer */}
          <span className="absolute size-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
        </AvatarBadge>
      </Avatar>
    );
  }

  if (isIdle) {
    return (
      <Avatar size="lg" className={cn("font-medium", getAvatarTone(name))}>
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
        <AvatarBadge className="bg-amber-500 size-2.5 border-none ring-2 ring-background p-0 absolute flex items-center justify-center">
          <span className="size-1.5 rounded-full bg-amber-500" />
        </AvatarBadge>
      </Avatar>
    );
  }

  // 3. Fully offline / pending
  return (
    <Avatar size="lg" className={cn("font-medium", getAvatarTone(name))}>
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
      <AvatarBadge className="bg-background size-2.5 border-none ring-2 ring-background p-0 absolute flex items-center justify-center">
        <span className="size-1.5 rounded-full bg-muted-foreground/20 ring-1 ring-muted-foreground/30" />
      </AvatarBadge>
    </Avatar>
  );
}

export const usersColumns: ColumnDef<UserRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Select all users"
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.email}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 hover:bg-transparent font-normal flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        User
        <ArrowUpDown className="size-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <AvatarCell name={row.original.name} lastActive={row.original.lastActive} status={row.original.status} />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
          <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-3 hover:bg-transparent font-normal flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <ArrowUpDown className="size-3.5" />
      </Button>
    ),
    filterFn: "equalsString",
    cell: ({ row }) => <RoleCell role={row.original.role} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "joinedDate",
    accessorFn: (row) => parse(row.joinedDate, "dd MMM yyyy, h:mm a", new Date()).getTime(),
    header: "Joined date",
    cell: ({ row }) => <div className="text-foreground text-sm">{row.original.joinedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/profile?uid=${row.original.uid || ""}`}>View Profile</Link>
        </Button>
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
];
