import { FileText, ShoppingBag } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LibraryItem } from "@/lib/types";

interface ItemNotesCardsProps {
  item: LibraryItem;
}

/** Public sourcing description and internal procurement notes, side by side. */
export function ItemNotesCards({ item }: ItemNotesCardsProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="border-border/30 border-b pb-4">
          <CardTitle>
            <ShoppingBag className="size-4 text-primary/80" />
            Public Description
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {item.description ? (
            <div className="rounded-lg border bg-background/25 p-3.5 text-muted-foreground text-sm leading-relaxed shadow-inner">
              {item.description}
            </div>
          ) : (
            <p className="py-2 text-muted-foreground/60 text-sm italic">
              No public descriptions draft logged for proposals.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-border/30 border-b pb-4">
          <CardTitle>
            <FileText className="size-4 text-primary/80" />
            Internal Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {item.internalNote ? (
            <div className="rounded-lg border bg-background/25 p-3.5 text-muted-foreground text-sm leading-relaxed shadow-inner">
              {item.internalNote}
            </div>
          ) : (
            <p className="py-2 text-muted-foreground/60 text-sm italic">No internal notes logged.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
