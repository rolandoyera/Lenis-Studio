import {
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Client } from "@/lib/types";
import { formatPhone, formatTaxId, normalizePhone } from "@/lib/utils";

interface ClientContactCardProps {
  client: Client;
}

/** Contact credentials panel: email, phone, company, plus quick email/call actions. */
export function ClientContactCard({ client }: ClientContactCardProps) {
  return (
    <Card>
      <CardHeader className="border-border border-b">
        <CardTitle>
          <Users className="size-4.5 text-primary" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-6.5 text-sm sm:grid-cols-2">
          {/* Left column: company, tax, and address details */}
          <div className="flex flex-col gap-6.5">
            {(client.street || client.city || client.state || client.zip) && (
              <div className="flex flex-col gap-1">
                <Label className="mb-1">Primary Address</Label>
                <div className="flex items-start gap-1.5 text-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
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
                    {(() => {
                      const fullAddress = [
                        client.street,
                        client.city,
                        client.state,
                        client.zip,
                      ]
                        .filter(Boolean)
                        .join(", ");
                      return (
                        fullAddress && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 flex w-fit items-center gap-1 text-primary text-xs hover:underline">
                            google maps
                            <ExternalLink className="size-3" />
                          </a>
                        )
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {client.taxId && (
              <div className="flex flex-col gap-1">
                <Label className="mb-1">Tax ID</Label>
                <div className="flex items-center gap-1.5 text-foreground">
                  <Building2 className="size-4 shrink-0 text-primary" />
                  <span>{formatTaxId(client.taxId)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="mb-1">Tax Status</Label>
              <div className="flex h-5 items-center gap-1.5 text-foreground">
                {client.taxable ? (
                  <Badge
                    variant="default"
                    className="flex h-5 w-fit items-center px-2 py-0 bg-primary/10 text-primary border border-primary/20">
                    Taxable
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="flex h-5 w-fit items-center px-2 py-0 text-muted-foreground">
                    Tax Exempt
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right column: direct contact details */}
          <div className="flex flex-col gap-6.5">
            <div className="flex flex-col gap-1">
              <Label className="mb-1">Contact</Label>
              <div className="flex items-center gap-1.5 text-foreground">
                <User className="size-4 shrink-0 text-primary" />
                <span>
                  {client.firstName} {client.lastName}
                </span>
              </div>
            </div>

            {client.email && (
              <div className="flex flex-col gap-1">
                <Label className="mb-1">Email Address</Label>
                <a
                  href={`mailto:${client.email}`}
                  className="group flex items-center gap-1.5 text-foreground transition-colors hover:text-primary">
                  <Mail className="size-4 shrink-0 text-primary" />
                  <span className="truncate group-hover:underline">
                    {client.email}
                  </span>
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex flex-col gap-1">
                <Label className="mb-1">Phone Number</Label>
                <a
                  href={`tel:${normalizePhone(client.phone)}`}
                  className="group flex items-center gap-1.5 text-foreground transition-colors hover:text-primary">
                  <Phone className="size-4 shrink-0 text-primary" />
                  <span className="group-hover:underline">
                    {formatPhone(client.phone)}
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row justify-end gap-4">
        <a href={`mailto:${client.email}`} className="w-fit">
          <Button variant="secondary" className="flex w-full text-xs">
            <Mail className="size-4.5" />
            Send Email
          </Button>
        </a>
        {client.phone ? (
          <a href={`tel:${normalizePhone(client.phone)}`} className="w-fit">
            <Button
              variant="secondary"
              className="flex w-20 items-center justify-center gap-1.5 text-xs">
              <Phone className="size-3.5" />
              Call
            </Button>
          </a>
        ) : (
          <Button
            variant="outline"
            disabled
            className="flex w-full items-center justify-center gap-1.5 text-xs">
            <Phone className="size-3.5" />
            Call
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
