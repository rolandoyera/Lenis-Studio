import { FileText, ShoppingBag } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LibraryItem } from "@/lib/types";

interface ItemNotesCardsProps {
  item: LibraryItem;
}

/** Public sourcing description and internal procurement notes, side by side. */
export function ItemNotesCards({ item }: ItemNotesCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      <Card className="bg-card/60 backdrop-blur-xs border border-border/40 shadow-xs">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-base font-medium font-heading flex items-center gap-2">
            <ShoppingBag className="size-4 text-primary/80" />
            Public Description
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {item.description ? (
            <div className="text-sm leading-relaxed text-muted-foreground bg-background/25 border p-3.5 rounded-lg shadow-inner">
              {item.description}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground/60 py-2">
              No public descriptions draft logged for proposals.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-xs border border-border/40 shadow-xs">
        <CardHeader className="pb-4 border-b border-border/30">
          <CardTitle className="text-base font-medium font-heading flex items-center gap-2">
            <FileText className="size-4 text-primary/80" />
            Internal Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {item.internalNote ? (
            <div className="text-sm leading-relaxed text-muted-foreground bg-background/25 border p-3.5 rounded-lg shadow-inner">
              {item.internalNote}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground/60 py-2">No internal notes logged.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
