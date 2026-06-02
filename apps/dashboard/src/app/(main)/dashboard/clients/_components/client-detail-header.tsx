"use client";

import { Briefcase, Calendar, Edit3, MoreVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { H1 } from "@/components/ui/typography";
import type { Client } from "@/lib/types";

import HeaderBackLink from "../../_components/HeaderBackLink";

interface ClientDetailHeaderProps {
  client: Client;
  onEdit: () => void;
  onRequestDelete: () => void;
}

/** Back link, initials avatar, client name + meta, and the edit/delete actions menu. */
export function ClientDetailHeader({ client, onEdit, onRequestDelete }: ClientDetailHeaderProps) {
  let firstName = "";
  if (typeof client.firstName === "string" && client.firstName.trim()) {
    firstName = client.firstName.trim();
  } else if (
    typeof (client as { fullName?: string }).fullName === "string" &&
    (client as { fullName?: string }).fullName!.trim()
  ) {
    firstName = (client as { fullName?: string }).fullName!.trim().split(" ")[0] || "";
  }

  let lastName = "";
  if (typeof client.lastName === "string" && client.lastName.trim()) {
    lastName = client.lastName.trim();
  } else if (
    typeof (client as { fullName?: string }).fullName === "string" &&
    (client as { fullName?: string }).fullName!.trim()
  ) {
    lastName = (client as { fullName?: string }).fullName!.trim().split(" ").slice(1).join(" ") || "";
  }

  const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "?";

  return (
    <>
      <HeaderBackLink page="Client Directory" href="/dashboard/clients" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-2xl shadow-xs">
            {initials.toUpperCase()}
          </div>
          <div>
            <H1>
              {firstName} {lastName}
            </H1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mt-1 text-muted-foreground font-medium">
              {client.company ? (
                <span className="flex items-center gap-1">
                  <Briefcase className="size-3.5 text-muted-foreground/80" />
                  {client.company}
                </span>
              ) : (
                <span className="italic text-muted-foreground/60">Private Residence</span>
              )}
              <span className="text-muted-foreground/30">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 text-muted-foreground/80" />
                Joined{" "}
                {new Date(client.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center sm:self-start md:self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" className="cursor-pointer">
                <MoreVertical className="size-4" />
                <span className="sr-only">Actions Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-popover/95 backdrop-blur-md">
              <DropdownMenuItem onClick={onEdit} className="text-sm cursor-pointer flex items-center gap-2">
                <Edit3 className="size-4 text-muted-foreground" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRequestDelete}
                className="text-sm text-destructive cursor-pointer flex items-center gap-2 focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Delete Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
