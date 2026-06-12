import { Edit2, FileText } from "lucide-react";

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
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <FileText className="icons" />
          Design Brief & Studio Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              <Edit2 className="size-3" />
              Add Studio Notes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
