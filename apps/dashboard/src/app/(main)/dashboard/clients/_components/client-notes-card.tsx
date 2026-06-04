import { Edit3, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/lib/types";

interface ClientNotesCardProps {
  client: Client;
  onEdit: () => void;
}

/** Design brief and internal studio notes for this client. */
export function ClientNotesCard({ client, onEdit }: ClientNotesCardProps) {
  return (
    <Card className="border border-border/40 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="border-border/30 border-b pb-4">
        <CardTitle className="flex items-center gap-2 font-bold font-heading text-lg">
          <FileText className="size-4.5 text-primary/80" />
          Design Brief & Studio Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {client.notes ? (
          <div className="whitespace-pre-wrap rounded-lg border border-border/40 bg-background/25 p-4 text-muted-foreground text-sm leading-relaxed shadow-inner">
            {client.notes}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <p className="text-xs italic">
              No design briefs or billing guidelines draft logged for this client profile.
            </p>
            <Button
              onClick={onEdit}
              variant="outline"
              className="mt-3 flex h-8 cursor-pointer items-center gap-1 px-3 py-1.5 text-xs"
            >
              <Edit3 className="size-3" />
              Write Studio Notes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
