import { CircleAlert, Mail, Phone, User } from "lucide-react";
import { AddressValue } from "@/components/ui/address-value";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Client } from "@/lib/types";
import { formatPhone, formatTaxId, normalizePhone } from "@/lib/utils";
import { DataField } from "@/components/ui/data-field";

interface ClientContactCardProps {
  client: Client;
}

/** Contact credentials panel: email, phone, company, plus quick email/call actions. */
export function ClientContactCard({ client }: ClientContactCardProps) {
  return (
    <Card variant="panel">
      <CardHeader>
        <CardTitle>
          <User className="icons" />
          Client Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-6.5 text-sm sm:grid-cols-2 md:h-62">
        <div className="flex flex-col gap-8">
          <DataField label="Contact">
            {client.firstName} {client.lastName}
          </DataField>
          <DataField label="Email Address" empty="Not provided">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="group flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <p className="truncate group-hover:underline">{client.email}</p>
              </a>
            )}
          </DataField>
          <DataField label="Phone Number" empty="Not provided">
            {client.phone && (
              <a
                href={`tel:${normalizePhone(client.phone)}`}
                className="group flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <span className="group-hover:underline">
                  {formatPhone(client.phone)}
                </span>
              </a>
            )}
          </DataField>
        </div>
        <div className="flex flex-col gap-6.5">
          <DataField
            label="Primary Address"
            empty="Not provided"
            className="h-21"
          >
            <AddressValue address={client} />
          </DataField>

          <DataField label="Tax ID" empty="Not provided">
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
            ) : null}
          </DataField>
          <DataField label="Tax Status">
            {client.taxable ? <p>Taxable</p> : <p>Tax Exempt</p>}
          </DataField>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-4 h-14">
        <a href={`mailto:${client.email}`} className="w-fit">
          <Button size="sm" variant="secondary" className="w-full">
            <Mail className="icons" />
            Email
          </Button>
        </a>
        {client.phone ? (
          <a href={`tel:${normalizePhone(client.phone)}`} className="w-fit">
            <Button size="sm" variant="secondary" className="w-20">
              <Phone className="icons" />
              Call
            </Button>
          </a>
        ) : null}
      </CardFooter>
    </Card>
  );
}
