"use client";

import Link from "next/link";

import { Edit3, Forklift, MoreVertical, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type { LibraryItem } from "@/lib/types";

import HeaderBackLink from "../../_components/HeaderBackLink";

interface ItemDetailHeaderProps {
  item: LibraryItem;
  vendorName?: string;
  onEdit: () => void;
  onRequestDelete: () => void;
}

/** Back link, item title banner, and the edit/delete actions menu. */
export function ItemDetailHeader({ item, vendorName, onEdit, onRequestDelete }: ItemDetailHeaderProps) {
  return (
    <>
      <HeaderBackLink href="/dashboard/library" />

      <div className="flex flex-col md:flex-row md:items-center justify-start gap-16 border-b pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge className="uppercase bg-primary/10 text-primary border border-primary/20">{item.category}</Badge>
          </div>
          <h1 className="text-3xl font-medium tracking-tight font-heading mt-1">{item.name}</h1>
          {vendorName && (
            <p className="text-[12px] text-muted-foreground font-medium flex items-center gap-1">
              <Forklift className="size-3.5 text-muted-foreground/60 shrink-0" />
              Vendor:{" "}
              {item.vendorId ? (
                <Link
                  href={`/dashboard/vendors/${item.vendorId}`}
                  className="hover:underline hover:text-primary transition-colors cursor-pointer"
                >
                  <Label size="large" className="text-foreground hover:text-primary cursor-pointer">
                    {vendorName}
                  </Label>
                </Link>
              ) : (
                <Label size="large">{vendorName}</Label>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center sm:self-start md:self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="cursor-pointer">
                <MoreVertical className="size-4" />
                <span className="sr-only">Actions Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover/95 backdrop-blur-md">
              <DropdownMenuItem onClick={onEdit} className="text-sm cursor-pointer flex items-center gap-2">
                <Edit3 className="size-4 text-muted-foreground" />
                Edit Specifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRequestDelete}
                className="text-sm text-destructive cursor-pointer flex items-center gap-2 focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
