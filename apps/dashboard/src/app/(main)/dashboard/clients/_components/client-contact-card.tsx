import { Briefcase, Mail, MapPin, Phone, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Client } from "@/lib/types";
import { formatPhone, normalizePhone } from "@/lib/utils";

interface ClientContactCardProps {
  client: Client;
}

/** Contact credentials panel: email, phone, company, plus quick email/call actions. */
export function ClientContactCard({ client }: ClientContactCardProps) {
  return (
    <Card className="border border-border/40 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="border-border/30 border-b pb-4">
        <CardTitle className="flex items-center gap-2 font-bold font-heading text-base">
          <Users className="size-4 text-primary/80" />
          Contact Credentials
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex flex-col gap-6.5 text-sm">
          {client.email && (
            <div className="flex flex-col gap-1">
              <Label className="mb-1 uppercase">Email Address</Label>
              <a
                href={`mailto:${client.email}`}
                className="group flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
              >
                <Mail className="size-4 shrink-0 text-primary/70" />
                <span className="truncate group-hover:underline">{client.email}</span>
              </a>
            </div>
          )}

          {client.phone && (
            <div className="flex flex-col gap-1">
              <Label className="mb-1 uppercase">Phone Number</Label>
              <a
                href={`tel:${normalizePhone(client.phone)}`}
                className="group flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
              >
                <Phone className="size-4 shrink-0 text-primary/70" />
                <span className="group-hover:underline">{formatPhone(client.phone)}</span>
              </a>
            </div>
          )}

          {client.company && (
            <div className="flex flex-col gap-1">
              <Label className="mb-1 uppercase">Company / Entity</Label>
              <div className="flex items-center gap-1.5 text-foreground">
                <Briefcase className="size-4 shrink-0 text-primary/70" />
                <span>{client.company}</span>
              </div>
            </div>
          )}

          {(client.street || client.city || client.state || client.zip) && (
            <div className="flex flex-col gap-1">
              <Label className="mb-1 uppercase">Primary Address</Label>
              <div className="flex items-start gap-1.5 text-foreground leading-tight">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" />
                <div className="flex flex-col">
                  {client.street && <span>{client.street}</span>}
                  {(client.city || client.state || client.zip) && (
                    <span className="mt-0.5">
                      {[client.city, [client.state, client.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-border/40 border-t pt-4">
          <a href={`mailto:${client.email}`} className="w-full">
            <Button
              variant="outline"
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-xs"
            >
              <Mail className="size-3.5" />
              Send Email
            </Button>
          </a>
          {client.phone ? (
            <a href={`tel:${normalizePhone(client.phone)}`} className="w-full">
              <Button
                variant="outline"
                className="flex w-full cursor-pointer items-center justify-center gap-1.5 text-xs"
              >
                <Phone className="size-3.5" />
                Call
              </Button>
            </a>
          ) : (
            <Button variant="outline" disabled className="flex w-full items-center justify-center gap-1.5 text-xs">
              <Phone className="size-3.5" />
              Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
