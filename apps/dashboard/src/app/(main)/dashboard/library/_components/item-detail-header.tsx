"use client";

import Link from "next/link";

import { Forklift, MoreVertical } from "lucide-react";

import { EditIcon, TrashIcon } from "@/components/icons/icons";
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

      <div className="flex flex-col justify-start gap-16 border-b pb-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Badge className="border border-primary/20 bg-primary/10 text-primary uppercase">{item.category}</Badge>
            {item.subcategory && (
              <Badge className="border border-muted-foreground/20 bg-muted/10 text-muted-foreground uppercase">
                {item.subcategory}
              </Badge>
            )}
          </div>
          <h1 className="mt-1 font-heading font-medium text-3xl tracking-tight">{item.name}</h1>
          {vendorName && (
            <p className="flex items-center gap-1 font-medium text-[12px] text-muted-foreground">
              <Forklift className="size-4 shrink-0 text-primary" />

              {item.vendorId ? (
                <Link
                  href={`/dashboard/vendors/${item.vendorId}`}
                  className="cursor-pointer transition-colors hover:text-primary hover:underline"
                >
                  <Label size="large" className="cursor-pointer text-foreground hover:text-primary">
                    {vendorName}
                  </Label>
                </Link>
              ) : (
                <Label size="large">{vendorName}</Label>
              )}
            </p>
          )}
        </div>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
                <span className="sr-only">Actions Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={onEdit}>
                <EditIcon size={4} />
                Edit Specifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRequestDelete} variant="destructive">
                <TrashIcon size={4} />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
