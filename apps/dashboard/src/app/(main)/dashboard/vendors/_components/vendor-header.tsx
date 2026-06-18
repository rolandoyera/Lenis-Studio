"use client";

import { MoreVertical } from "lucide-react";

import { EditIcon, TrashIcon } from "@/components/icons/icons";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  TooltipDropdownMenu,
} from "@/components/ui/dropdown-menu";
import { H1 } from "@/components/ui/typography";
import type { Vendor } from "@/lib/types";

import HeaderBackLink from "../../_components/HeaderBackLink";

interface VendorHeaderProps {
  vendor: Vendor;
  onEdit: () => void;
  onRequestDelete: () => void;
}

/** Back link, vendor title banner, website, and the edit/delete actions menu. */
export function VendorHeader({
  vendor,
  onEdit,
  onRequestDelete,
}: VendorHeaderProps) {
  return (
    <>
      <HeaderBackLink href="/dashboard/vendors" />

      <div className="flex flex-col gap-16 border-b pb-4 md:flex-row md:items-start">
        <div className="flex flex-col gap-1.5">
          <H1>{vendor.name}</H1>
          {vendor.category && (
            <div className="flex items-center gap-1.5">
              <Tag className="size-2.5 text-primary" />
              <Label> {vendor.category}</Label>
            </div>
          )}
        </div>

        <div>
          <TooltipDropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
                <span className="sr-only">Actions Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuLabel>Manage Vendor</DropdownMenuLabel>
              <DropdownMenuItem onClick={onEdit}>
                <EditIcon size={4} />
                Edit Vendor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRequestDelete} variant="destructive">
                <TrashIcon size={4} />
                Delete Vendor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </TooltipDropdownMenu>
        </div>
      </div>
    </>
  );
}
