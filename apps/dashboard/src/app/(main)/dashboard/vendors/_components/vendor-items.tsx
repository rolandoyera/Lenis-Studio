"use client";

import Link from "next/link";

import { ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { LibraryItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface VendorItemsProps {
  items: LibraryItem[];
}

export function VendorItems({ items }: VendorItemsProps) {
  return (
    <Card className="flex max-h-[522px] flex-col bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            Linked Library Items
          </span>
          <Badge variant="secondary" className="px-2 py-0.5 font-bold text-xs">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <ShoppingBag className="mb-2 size-10 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground text-sm">No linked products</p>
            <p className="mt-1 max-w-[240px] text-muted-foreground/60 text-xs">
              Items from the product library will appear here when added to this vendor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map((item) => (
              <div key={item.itemId} className="flex items-center gap-3 p-3">
                {/* Thumbnail */}
                <div className="flex size-32 shrink-0 items-center justify-center overflow-hidden rounded border border-border/50 bg-background/50">
                  {item.coverImageUrl ? (
                    <img src={item.coverImageUrl} alt={item.name} className="h-full w-full object-contain p-0.5" />
                  ) : (
                    <ShoppingBag className="size-5 text-muted-foreground/30" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/library/${item.itemId}`}
                    className="line-clamp-1 font-heading font-semibold text-sm transition-colors hover:text-primary hover:underline"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2">
                    {item.sku && <Label>SKU: {item.sku}</Label>}
                    {item.sku && item.category && <Label>•</Label>}
                    <Label>{item.category}</Label>
                  </div>
                </div>

                {/* Pricing */}
                <div className="shrink-0 text-right">
                  <Label className="block">Retail</Label>
                  <p className="font-semibold text-foreground text-sm">
                    {formatCurrency(item.sellingPrice, { noDecimals: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
