"use client";

import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataField } from "@/components/ui/data-field";
import type { Client, Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ProjectInformationCardProps {
  project: Project;
  client: Client | null;
}

export function ProjectInformationCard({
  project,
  client,
}: ProjectInformationCardProps) {
  // First + last name are mandatory at creation, so a simple join is enough;
  // company is the fallback for company-type contacts.
  const clientName = client
    ? `${client.firstName} ${client.lastName}`.trim() || client.company || ""
    : "";

  return (
    <Card variant="panel" className="col-span-4">
      <CardHeader>
        <CardTitle>
          <Building2 className="icons" />
          Project Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-6.5 text-sm sm:grid-cols-2 md:h-62">
        <DataField label="Project Number" empty="Not set">
          {project.projectCode}
        </DataField>
        <DataField label="Client Name" empty="Not set">
          {client && (
            <Link
              href={`/dashboard/clients/${client.uid}`}
              prefetch={false}
              className="flex items-center gap-1.5 text-primary hover:text-primary hover:underline">
              {clientName}
            </Link>
          )}
        </DataField>
        <DataField label="Project Site" empty="Not set">
          {/* biome-ignore lint/nursery/useNullishCoalescing: truthy check for address fields */}
          {(project.street || project.city || project.state || project.zip) && (
            <div className="flex flex-col">
              {project.street && <span>{project.street}</span>}
              {/* biome-ignore lint/nursery/useNullishCoalescing: truthy check for address fields */}
              {(project.city || project.state || project.zip) && (
                <span className="mt-0.5">
                  {[
                    project.city,
                    [project.state, project.zip].filter(Boolean).join(" "),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              {(() => {
                const fullAddress = [
                  project.street,
                  project.city,
                  project.state,
                  project.zip,
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
                      Google Maps
                      <ExternalLink className="size-3" />
                    </a>
                  )
                );
              })()}
            </div>
          )}
        </DataField>
        <DataField label="Budget" empty="Not set">
          {project.budget !== undefined &&
            project.budget > 0 &&
            formatCurrency(project.budget, { noDecimals: true })}
        </DataField>
      </CardContent>
    </Card>
  );
}
