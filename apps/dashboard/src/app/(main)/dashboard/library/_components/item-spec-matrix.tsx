import type React from "react";

import { ExternalLink, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { LibraryItem, Vendor } from "@/lib/types";

import { withProtocol } from "./library-constants";

/** Show the value, or a muted "N/A" placeholder when it is empty. */
const na = (value?: string) => (value ? value : "N/A");

function SpecField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-background p-4">
      <Label className="uppercase">{label}</Label>
      {value && (
        <span className="font-medium text-foreground text-sm capitalize">
          {value}
        </span>
      )}
      {!value && (
        <span className="font-medium text-muted-foreground/30 text-sm">
          N/A
        </span>
      )}
    </div>
  );
}

interface ItemSpecMatrixProps {
  item: LibraryItem;
  vendor?: Vendor;
}

/** Spec grid plus assigned vendor and direct product link. */
export function ItemSpecMatrix({ item, vendor }: ItemSpecMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Tag className="size-4.5 text-primary" />
          Specifications
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm md:grid-cols-4">
          <SpecField label="Finish / Color" value={na(item.finishColor)} />
          <SpecField label="Materials" value={na(item.materials)} />
          <SpecField label="Dimensions" value={na(item.dimensions)} />
          <SpecField label="SKU / Model #" value={na(item.sku)} />
          <SpecField label="Unit Type" value={item.unitType} />
          <SpecField label="Manufacturer" value={item.manufacturer} />
          <SpecField label="Category" value={item.category} />
          <SpecField label="Subcategory" value={item.subcategory} />
        </div>

        <div className="flex w-full items-center justify-between pt-4">
          {vendor && (
            <div className="flex min-w-70 flex-col gap-2">
              <Label className="text-xs uppercase">
                Assigned Sourcing Vendor
              </Label>
              <div className="flex items-center justify-between rounded-lg border bg-muted/10 p-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-sm">
                    {vendor.name}
                  </span>
                  {vendor.website && (
                    <a
                      href={withProtocol(vendor.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 flex items-center gap-0.5 font-medium text-primary text-xs hover:underline">
                      {vendor.website}
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {item.sourcingLink && (
            <div className="pt-4">
              <a
                href={withProtocol(item.sourcingLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full">
                <Button className="flex w-full cursor-pointer items-center justify-center gap-1.5 py-2.5">
                  <ExternalLink className="size-4" />
                  Go to Product Website
                </Button>
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
