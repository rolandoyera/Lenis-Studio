"use client";

import { MoreVertical } from "lucide-react";

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
import { H1 } from "@/components/ui/typography";
import type { Vendor } from "@/lib/types";

import HeaderBackLink from "../../_components/HeaderBackLink";

interface VendorHeaderProps {
  vendor: Vendor;
  onEdit: () => void;
  onRequestDelete: () => void;
}

/** Back link, vendor title banner, website, and the edit/delete actions menu. */
export function VendorHeader({ vendor, onEdit, onRequestDelete }: VendorHeaderProps) {
  const websiteHref = vendor.website
    ? vendor.website.startsWith("http")
      ? vendor.website
      : `https://${vendor.website}`
    : null;

  return (
    <>
      <HeaderBackLink href="/dashboard/vendors" />

      <div className="flex flex-col gap-16 border-b pb-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-1.5">
          {vendor.category && (
            <div className="flex items-center gap-2">
              <Badge className="border border-primary/20 bg-primary/10 text-primary uppercase">{vendor.category}</Badge>
            </div>
          )}
          <H1>{vendor.name}</H1>
          {websiteHref && (
            <p className="flex items-center gap-1 font-medium text-[12px] text-muted-foreground">
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer transition-colors hover:text-primary hover:underline"
              >
                {vendor.website?.replace(/(^\w+:|^)\/\//, "")}
              </a>
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
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRequestDelete} variant="destructive">
                <TrashIcon size={4} />
                Delete Vendor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
