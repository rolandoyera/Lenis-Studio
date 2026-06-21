import Link from "next/link";

import {
  ExternalLink,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { DashboardImage } from "@/components/dashboard-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { H3 } from "@/components/ui/typography";
import type { LibraryItem, Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function LibraryItemCard({
  item,
  parentVendor,
}: {
  item: LibraryItem;
  parentVendor?: Vendor;
}) {
  const vendorName = parentVendor?.name || "Unknown Vendor";
  const profitable = item.sellingPrice > item.unitCost;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden pt-0 transition-all duration-200 has-[.detail-link:hover]:-translate-y-1 has-[.detail-link:hover]:shadow-md">
      {/* Visual Thumbnail Area */}
      <Link
        href={`/dashboard/library/${item.itemId}`}
        className="detail-link relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden border-border/40 border-b bg-muted/40">
        {item.coverImageUrl ? (
          <DashboardImage
            priority
            src={item.coverImageUrl}
            alt={item.name}
            sizes="(min-width: 1536px) 14vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-200"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <ShoppingBag className="size-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Sourcing Category & Subcategory Tags */}
        <div className="absolute top-2 left-2.5 flex items-center gap-1.5">
          <Badge variant="overlay">{item.category}</Badge>
          {item.subcategory && (
            <Badge variant="overlay">{item.subcategory}</Badge>
          )}
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex-1">
          {/* Item Name - Clicking/hovering on the title takes you to the detail page */}
          <H3 className="transition-colors group-has-[.detail-link:hover]:text-primary">
            <Link
              href={`/dashboard/library/${item.itemId}`}
              className="detail-link block">
              {item.name}
            </Link>
          </H3>

          {/* Vendor Name - Clicking on the vendor name filters the vendor profile in directory */}
          <div className="mt-1 flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
            {item.vendorId ? (
              parentVendor?.website ? (
                <a
                  href={
                    parentVendor.website.startsWith("http")
                      ? parentVendor.website
                      : `https://${parentVendor.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 truncate font-medium text-foreground/80 hover:text-primary hover:underline">
                  {vendorName}
                  <ExternalLink className="ml-1 size-2.5 shrink-0" />
                </a>
              ) : (
                <Link
                  href={`/dashboard/vendors/${item.vendorId}`}
                  className="flex items-center gap-0.5 truncate font-medium text-foreground/80 hover:text-primary hover:underline">
                  {vendorName}
                  <ExternalLink className="size-2.5 shrink-0" />
                </Link>
              )
            ) : (
              <span className="font-medium text-foreground/60">
                {vendorName}
              </span>
            )}
          </div>

          {/* Product webpage link on vendor's site */}
          {item.sourcingLink ? (
            <a
              href={
                item.sourcingLink.startsWith("http")
                  ? item.sourcingLink
                  : `https://${item.sourcingLink}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1.5 py-0.5 font-medium text-[12px] text-primary transition-colors hover:underline">
              <span className="truncate">Origin Link</span>
              <ExternalLink className="size-2.5 shrink-0" />
            </a>
          ) : (
            <span className="mt-2 inline-flex max-w-full select-none items-center gap-1.5 rounded-md border border-border/20 bg-muted/20 px-2 py-0.5 font-normal text-[10px] text-muted-foreground/45 italic">
              <span>No product link</span>
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        {/* Pricing Matrix summary */}
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <Label className="mb-1">Cost</Label>
            <span className="font-semibold text-foreground/75 text-sm">
              {formatCurrency(item.unitCost)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <Label className="mb-1 ml-auto">Selling Price</Label>
            <span className="font-bold text-primary text-sm">
              {formatCurrency(item.sellingPrice)}
            </span>
          </div>
        </div>

        {/* Calculated Margin indicators */}
        <Badge
          variant={profitable ? "success" : "warning"}
          className="mx-auto mt-3 -mb-1 gap-1">
          {profitable ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          <span className="font-semibold">{Math.round(item.markup)}%</span>
          <span>markup</span>
        </Badge>
      </CardFooter>
    </Card>
  );
}
