import type { LucideIcon } from "lucide-react";
import { UserCog, UserRound } from "lucide-react";

export type UserStatus = "Active" | "Pending" | "Deactivated" | "Locked" | "Suspended";

export type UserRow = {
  uid?: string;
  email: string;
  joinedDate: string;
  lastActive: number;
  name: string;
  role: string;
  status: UserStatus;
};

export const users: UserRow[] = [];

export const filters = {
  role: ["All", "Admin", "Contributor"],
  status: ["All", "Active", "Pending", "Deactivated", "Locked", "Suspended"],
};

export const roleMeta: Record<string, { className: string; icon: LucideIcon }> = {
  Admin: { className: "text-amber-300", icon: UserCog },
  Contributor: { className: "text-rose-300", icon: UserRound },
};

export const statusMeta: Record<UserStatus, { badgeClass: string; dotClass: string }> = {
  Active: {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  Pending: {
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  Deactivated: {
    badgeClass: "border-border bg-muted/50 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  Locked: {
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
  },
  Suspended: {
    badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
};
