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
    <div className="bg-background p-4 flex flex-col gap-1.5">
      <Label className="uppercase">{label}</Label>
      <span className="text-sm font-medium text-foreground capitalize">
        {value}
      </span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px border border-border rounded-xl overflow-hidden text-sm bg-border">
          <SpecField label="Finish / Color" value={na(item.finishColor)} />
          <SpecField label="Materials" value={na(item.materials)} />
          <SpecField label="Dimensions" value={na(item.dimensions)} />
          <SpecField label="Unit Type" value={item.unitType} />
          <SpecField label="Cost Type" value={item.costType} />
          <SpecField label="SKU / Model #" value={na(item.sku)} />
        </div>

        <div className="flex items-center justify-between w-full pt-4">
          {vendor && (
            <div className="flex flex-col gap-2 min-w-70">
              <Label className="text-xs uppercase">
                Assigned Sourcing Vendor
              </Label>
              <div className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/10">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm text-foreground">
                    {vendor.name}
                  </span>
                  {vendor.website && (
                    <a
                      href={withProtocol(vendor.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5 mt-0.5">
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
                className="w-full block">
                <Button className="w-full py-2.5 flex items-center justify-center gap-1.5 cursor-pointer">
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
