import Link from "next/link";

import { DollarSign, FolderKanban, MapPin, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H3 } from "@/components/ui/typography";
import type { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_VARIANT,
} from "../../projects/_components/project-constants";

interface ClientProjectsCardProps {
  projects: Project[];
  onAddProject: () => void;
}

/** Associated project spaces grid with an "Initialize Project" entry point. */
export function ClientProjectsCard({
  projects,
  onAddProject,
}: ClientProjectsCardProps) {
  return (
    <Card className="pt-0">
      <CardHeader className="bg-muted/50 h-15 flex items-center justify-between">
        <CardTitle>
          <FolderKanban className="icons" />
          Projects
        </CardTitle>

        <Button size="sm" variant="secondary" onClick={onAddProject}>
          <Plus className="size-3.5" />
          Start New Project
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-background/20 p-6 py-10 text-center">
            <FolderKanban className="mb-2 size-10 text-muted-foreground/30" />
            <h3 className="font-semibold text-sm">No projects created</h3>
            <p className="mt-1 max-w-xs text-muted-foreground text-xs">
              Begin drafting budget pools, address details, and design briefs by
              setting up this client's first project.
            </p>
            <Button onClick={onAddProject} className="mt-4">
              <Plus className="size-3.5" />
              Initialize First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.projectId}
                className="flex flex-col gap-3 rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="mt-1 flex items-center justify-between">
                  <H3 className="text-muted-foreground">{project.name}</H3>
                  <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 rounded-md border border-muted/30 bg-muted/20 p-2.5 text-muted-foreground text-xs">
                  {project.budget !== undefined && project.budget > 0 && (
                    <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                      <DollarSign className="size-3.5 shrink-0 text-emerald-500" />
                      Budget:{" "}
                      <span className="font-semibold text-foreground/90">
                        {formatCurrency(project.budget, { noDecimals: true })}
                      </span>
                    </div>
                  )}
                  {project.address && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="size-3.5 shrink-0 text-primary/70" />
                      {project.address}
                    </div>
                  )}
                </div>

                {project.notes && (
                  <p className="line-clamp-2 text-[11px] text-muted-foreground/80 italic leading-relaxed">
                    "{project.notes}"
                  </p>
                )}

                <div className="mt-1 flex items-center justify-end border-border/40 border-t pt-2.5">
                  <Link
                    href={`/dashboard/projects/${project.projectId}`}
                    prefetch={false}
                    className="flex items-center gap-0.5 font-bold text-[11px] text-primary hover:underline">
                    View Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
