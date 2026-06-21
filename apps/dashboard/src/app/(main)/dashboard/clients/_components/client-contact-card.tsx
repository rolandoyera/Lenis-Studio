import { CircleAlert, ExternalLink, Mail, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Client } from "@/lib/types";
import { formatPhone, formatTaxId, normalizePhone } from "@/lib/utils";

interface ClientContactCardProps {
  client: Client;
}

/** Contact credentials panel: email, phone, company, plus quick email/call actions. */
export function ClientContactCard({ client }: ClientContactCardProps) {
  const hasAddress = Boolean(
    client.street ?? client.city ?? client.state ?? client.zip,
  );
  const hasCityStateZip = Boolean(client.city ?? client.state ?? client.zip);

  return (
    <Card className="pt-0">
      <CardHeader className="bg-muted/50 flex items-center h-15">
        <CardTitle>
          <Users className="icons" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-x-6 gap-y-6.5 text-sm sm:grid-cols-2">
          {/* Left column: company, tax, and address details */}
          <div className="flex flex-col gap-6.5">
            {hasAddress && (
              <div className="flex flex-col gap-2">
                <Label>Primary Address</Label>

                <div className="flex flex-col">
                  {client.street && <span>{client.street}</span>}
                  {hasCityStateZip && (
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
                          className="mt-1.5 flex w-fit items-center gap-1 text-primary text-xs hover:underline"
                        >
                          google maps
                          <ExternalLink className="size-3" />
                        </a>
                      )
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Tax ID</Label>
              {client.taxId ? (
                <p>{formatTaxId(client.taxId)}</p>
              ) : !client.taxable ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="flex w-fit items-center gap-1.5 text-yellow-600 text-sm">
                        <span className="relative flex size-4 items-center justify-center">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-yellow-500/60" />
                          <CircleAlert className="relative size-4" />
                        </span>
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      Client is listed as tax exempt but tax # is not on file.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="text-muted-foreground text-sm">—</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tax Status</Label>
              {client.taxable ? <p>Taxable</p> : <p>Tax Exempt</p>}
            </div>
          </div>

          {/* Right column: direct contact details */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <Label>Contact</Label>
              <p>
                {client.firstName} {client.lastName}
              </p>
            </div>

            {client.email && (
              <div className="flex flex-col gap-2">
                <Label>Email Address</Label>
                <a
                  href={`mailto:${client.email}`}
                  className="group flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  <p className="truncate group-hover:underline">
                    {client.email}
                  </p>
                </a>
              </div>
            )}

            {client.phone && (
              <div className="flex flex-col gap-2">
                <Label>Phone Number</Label>
                <a
                  href={`tel:${normalizePhone(client.phone)}`}
                  className="group flex items-center gap-1.5 pl-1 transition-colors hover:text-primary"
                >
                  <span className="group-hover:underline">
                    {formatPhone(client.phone)}
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-4">
        <a href={`mailto:${client.email}`} className="w-fit">
          <Button size="lg" variant="secondary" className="w-full text-xs">
            <Mail className="size-3.5" />
            Send Email
          </Button>
        </a>
        {client.phone ? (
          <a href={`tel:${normalizePhone(client.phone)}`} className="w-fit">
            <Button size="lg" variant="secondary" className="w-20 text-xs">
              <Phone className="size-3.5" />
              Call
            </Button>
          </a>
        ) : (
          <Button
            variant="outline"
            disabled
            className="flex w-full items-center justify-center gap-1.5 text-xs"
          >
            <Phone className="size-3.5" />
            Call
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
