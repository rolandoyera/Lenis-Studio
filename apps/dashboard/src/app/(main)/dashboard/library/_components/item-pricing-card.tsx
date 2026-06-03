import { Calculator, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { LibraryItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ItemPricingCardProps {
  item: LibraryItem;
}

/** Cost / markup / selling-price / net-profit in a single cohesive 4-cell row. */
export function ItemPricingCard({ item }: ItemPricingCardProps) {
  const profit = item.sellingPrice - item.unitCost;
  const profitable = profit > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Calculator className="size-4.5 text-primary/80" />
          Cost & Pricing Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Four-cell pricing row — gap-px/bg-border produces hairline dividers */}
        <div className="grid grid-cols-4 gap-px rounded-xl border border-border/50 bg-border overflow-hidden text-center">
          {/* Sourcing Cost */}
          <div className="flex flex-col justify-center items-center gap-1 p-3.5 bg-linear-to-t from-primary/10 to-card shadow-xs bg-card">
            <Label className="uppercase">Cost</Label>
            <span className="text-base font-medium text-foreground">{formatCurrency(item.unitCost)}</span>
          </div>

          {/* Markup */}
          <div className="flex flex-col justify-center items-center gap-1 p-3.5 bg-linear-to-t from-primary/10 to-card shadow-xs bg-card">
            <Label className="uppercase">Markup</Label>
            <span className="text-base font-medium text-foreground">{Math.round(item.markup)}%</span>
          </div>

          {/* Selling Price */}
          <div className="flex flex-col justify-center items-center gap-1 p-3.5 bg-linear-to-t from-primary/10 to-card shadow-xs bg-card">
            <Label className="uppercase">Selling Price</Label>
            <span className="text-base font-medium text-foreground">{formatCurrency(item.sellingPrice)}</span>
          </div>

          {/* Net Profit — emerald when profitable, amber when not */}
          <div
            className={
              profitable
                ? "flex flex-col gap-1 p-3.5 bg-linear-to-t from-emerald-600/10 to-card shadow-xs bg-card"
                : "flex flex-col gap-1 p-3.5 bg-linear-to-t from-red-500/10 to-card shadow-xs bg-card"
            }
          >
            <span
              className={`flex items-center justify-center gap-1 text-[10px] font-medium tracking-wider uppercase ${
                profitable ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              }`}
            >
              {profitable ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              Profit
            </span>
            <span
              className={`text-base font-semibold font-mono ${
                profitable ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
              }`}
            >
              {formatCurrency(profit)}
            </span>
          </div>
        </div>

        {/* Optional MSRP */}
        {item.msrp && item.msrp > 0 ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3 border-border/30">
            <span>Suggested Retail (MSRP)</span>
            <span className="font-medium text-foreground/80 font-mono">{formatCurrency(item.msrp)}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
