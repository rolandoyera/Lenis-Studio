"use client";

import Link from "next/link";

import { Building2, DollarSign, ExternalLink, Mail, MapPin, Phone, User, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Client, Project } from "@/lib/types";
import { formatPhone, normalizePhone } from "@/lib/utils";

interface ProjectInformationCardProps {
  project: Project;
  client: Client | null;
}

export function ProjectInformationCard({ project, client }: ProjectInformationCardProps) {
  let clientName = "Unnamed Client";
  if (client) {
    const firstName = client.firstName?.trim() || "";
    const lastName = client.lastName?.trim() || "";
    clientName = `${firstName} ${lastName}`.trim() || client.company || "Unnamed Client";
  }

  return (
    <Card>
      <CardHeader className="border-border border-b">
        <CardTitle>
          <Building2 className="size-4.5 text-primary" />
          Project Information
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-5">
        {/* Site Details */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 text-sm">
            <Label className="mb-1">Site Location</Label>
            {project.street || project.city || project.state || project.zip ? (
              <div className="flex items-start gap-1.5 text-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex flex-col">
                  {project.street && <span>{project.street}</span>}
                  {/* biome-ignore lint/nursery/useNullishCoalescing: truthy check for address fields */}
                  {(project.city || project.state || project.zip) && (
                    <span className="mt-0.5">
                      {[project.city, [project.state, project.zip].filter(Boolean).join(" ")]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                  {(() => {
                    const fullAddress = [project.street, project.city, project.state, project.zip]
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
                          Google Maps
                          <ExternalLink className="size-3" />
                        </a>
                      )
                    );
                  })()}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs italic">No site address specified</span>
            )}
          </div>

          {project.budget && (
            <div className="flex flex-col gap-1 text-sm">
              <Label className="mb-1">Budget Pool</Label>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <DollarSign className="size-4 shrink-0 text-emerald-500" />
                <span>{project.budget}</span>
              </div>
            </div>
          )}
        </div>

        {/* Client details separator */}
        <div className="border-t pt-5">
          <h4 className="mb-4 flex items-center gap-1.5 font-semibold text-foreground text-sm">
            <Users className="size-4 text-primary" />
            Client Contact Details
          </h4>

          {client ? (
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <Label className="mb-1">Contact Name</Label>
                <Link
                  href={`/dashboard/clients/${client.uid}`}
                  prefetch={false}
                  className="flex items-center gap-1.5 text-foreground hover:text-primary hover:underline"
                >
                  <User className="size-4 shrink-0 text-primary" />
                  <span>{clientName}</span>
                </Link>
              </div>

              {client.email && (
                <div className="flex flex-col gap-1">
                  <Label className="mb-1">Email Address</Label>
                  <a
                    href={`mailto:${client.email}`}
                    className="group flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
                  >
                    <Mail className="size-4 shrink-0 text-primary" />
                    <span className="truncate group-hover:underline">{client.email}</span>
                  </a>
                </div>
              )}

              {client.phone && (
                <div className="flex flex-col gap-1">
                  <Label className="mb-1">Phone Number</Label>
                  <a
                    href={`tel:${normalizePhone(client.phone)}`}
                    className="group flex items-center gap-1.5 text-foreground transition-colors hover:text-primary"
                  >
                    <Phone className="size-4 shrink-0 text-primary" />
                    <span className="group-hover:underline">{formatPhone(client.phone)}</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs italic">No client profile assigned</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
