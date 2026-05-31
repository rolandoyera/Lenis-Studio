import { Briefcase, Mail, MapPin, Phone, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Client } from "@/lib/types";
import { Label } from "@/components/ui/label";

interface ClientContactCardProps {
  client: Client;
}

/** Contact credentials panel: email, phone, company, plus quick email/call actions. */
export function ClientContactCard({ client }: ClientContactCardProps) {
  return (
    <Card className="bg-card/60 backdrop-blur-xs border border-border/40 shadow-xs">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="text-base font-bold font-heading flex items-center gap-2">
          <Users className="size-4 text-primary/80" />
          Contact Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-6.5 text-sm">
          {client.email && (
            <div className="flex flex-col gap-1">
              <Label className="uppercase mb-1">Email Address</Label>
              <a
                href={`mailto:${client.email}`}
                className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                <Mail className="size-4 text-primary/70 shrink-0" />
                <span className="truncate group-hover:underline">
                  {client.email}
                </span>
              </a>
            </div>
          )}

          {client.phone && (
            <div className="flex flex-col gap-1">
              <Label className="uppercase mb-1">Phone Number</Label>
              <a
                href={`tel:${client.phone}`}
                className="text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group">
                <Phone className="size-4 text-primary/70 shrink-0" />
                <span className="group-hover:underline">{client.phone}</span>
              </a>
            </div>
          )}

          {client.company && (
            <div className="flex flex-col gap-1">
              <Label className="uppercase mb-1">Company / Entity</Label>
              <div className="text-foreground flex items-center gap-1.5">
                <Briefcase className="size-4 text-primary/70 shrink-0" />
                <span>{client.company}</span>
              </div>
            </div>
          )}

          {(client.street || client.city || client.state || client.zip) && (
            <div className="flex flex-col gap-1">
              <Label className="uppercase mb-1">Primary Address</Label>
              <div className="text-foreground flex items-start gap-1.5 leading-tight">
                <MapPin className="size-4 text-primary/70 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  {client.street && <span>{client.street}</span>}
                  {(client.city || client.state || client.zip) && (
                    <span className="mt-0.5">
                      {[
                        client.city,
                        [client.state, client.zip].filter(Boolean).join(" "),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-t border-border/40 pt-4">
          <a href={`mailto:${client.email}`} className="w-full">
            <Button
              variant="outline"
              className="w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer">
              <Mail className="size-3.5" />
              Send Email
            </Button>
          </a>
          {client.phone ? (
            <a href={`tel:${client.phone}`} className="w-full">
              <Button
                variant="outline"
                className="w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <Phone className="size-3.5" />
                Call
              </Button>
            </a>
          ) : (
            <Button
              variant="outline"
              disabled
              className="w-full text-xs flex items-center justify-center gap-1.5">
              <Phone className="size-3.5" />
              Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
