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

