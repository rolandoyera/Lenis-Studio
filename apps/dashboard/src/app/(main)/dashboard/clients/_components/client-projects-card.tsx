import Link from "next/link";

import { DollarSign, FolderKanban, MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";

const STATUS_STYLES: Record<Project["status"], string> = {
  Active: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  Completed: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  Paused: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
};

const STATUS_BAR: Record<Project["status"], string> = {
  Active: "from-emerald-500/30 via-emerald-500/5 to-transparent",
  Completed: "from-blue-500/30 via-blue-500/5 to-transparent",
  Paused: "from-amber-500/30 via-amber-500/5 to-transparent",
};

interface ClientProjectsCardProps {
  projects: Project[];
  onAddProject: () => void;
}

/** Associated project spaces grid with an "Initialize Project" entry point. */
export function ClientProjectsCard({ projects, onAddProject }: ClientProjectsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-border/30 border-b pb-4">
        <CardTitle>
          <FolderKanban className="size-4.5 text-primary" />
          Projects
        </CardTitle>
        <Button variant="secondary" onClick={onAddProject}>
          <Plus className="size-3.5" />
          Initialize Project
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-background/20 p-6 py-10 text-center">
            <FolderKanban className="mb-2 size-10 text-muted-foreground/30" />
            <h3 className="font-semibold text-sm">No projects created</h3>
            <p className="mt-1 max-w-xs text-muted-foreground text-xs">
              Begin drafting budget pools, address details, and design briefs by setting up this client's first project.
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
                className="group/proj relative flex flex-col gap-3 rounded-lg border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/20 hover:shadow-xs"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 rounded-t-lg bg-linear-to-r transition-all ${STATUS_BAR[project.status]}`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <h4 className="line-clamp-1 font-semibold text-base text-foreground leading-tight transition-colors group-hover/proj:text-primary">
                    {project.name}
                  </h4>
                  <span
                    className={`rounded-full px-2 py-0.5 font-bold text-[9px] uppercase tracking-wider ${STATUS_STYLES[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 rounded-md border border-muted/30 bg-muted/20 p-2.5 text-muted-foreground text-xs">
                  {project.budget && (
                    <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                      <DollarSign className="size-3.5 shrink-0 text-emerald-500" />
                      Budget: <span className="font-semibold text-foreground/90">{project.budget}</span>
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
                    href={`/dashboard/proposals?projectId=${project.projectId}`}
                    prefetch={false}
                    className="flex items-center gap-0.5 font-bold text-[11px] text-primary hover:underline"
                  >
                    Configure Proposals →
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
