"use client";

import {
  Building2,
  Calendar,
  Edit,
  MoreVertical,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  TooltipDropdownMenu,
} from "@/components/ui/dropdown-menu";
import { H1 } from "@/components/ui/typography";
import type { Client } from "@/lib/types";

import HeaderBackLink from "../../_components/HeaderBackLink";
import { getClientName } from "./client-name";

interface ClientDetailHeaderProps {
  client: Client;
  onEdit: () => void;
  onRequestDelete: () => void;
}

/** Back link, initials avatar, client name + meta, and the edit/delete actions menu. */
export function ClientDetailHeader({
  client,
  onEdit,
  onRequestDelete,
}: ClientDetailHeaderProps) {
  const { firstName, lastName } = getClientName(client);

  return (
    <>
      <HeaderBackLink href="/dashboard/clients" />

      <div className="flex flex-col gap-16 pb-4 md:flex-row md:items-start">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-xs">
            {client.company ? (
              <Building2 className="size-6" />
            ) : (
              <User className="size-6" />
            )}
          </div>
          <div>
            <H1>
              {client.company ? client.company : `${firstName} ${lastName}`}
            </H1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-muted-foreground text-sm">
              {client.company ? (
                <span className="flex items-center gap-1">
                  <User className="size-3.5 text-muted-foreground/80" />
                  {firstName} {lastName}
                </span>
              ) : (
                <span className="text-muted-foreground/60 italic">
                  Private Residence
                </span>
              )}
              {client.clientCode && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="font-mono">
                    Client Ref: {client.clientCode}
                  </span>
                </>
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

        <div>
          <TooltipDropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
                <span className="sr-only">Actions Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="size-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={onRequestDelete}
                >
                  <Trash2 className="size-4" />
                  Delete Profile
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </TooltipDropdownMenu>
        </div>
      </div>
    </>
  );
}
