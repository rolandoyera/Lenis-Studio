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
    <Card className="bg-card/60 backdrop-blur-xs border border-border/40 shadow-xs">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
          <FileText className="size-4.5 text-primary/80" />
          Design Brief & Studio Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {client.notes ? (
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-background/25 border border-border/40 p-4 rounded-lg shadow-inner">
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
              className="mt-3 flex items-center gap-1 px-3 py-1.5 h-8 text-xs cursor-pointer"
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
