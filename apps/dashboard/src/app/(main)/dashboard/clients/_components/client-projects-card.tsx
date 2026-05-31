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
    <Card className="bg-card/60 backdrop-blur-xs border border-border/40 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30">
        <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
          <FolderKanban className="size-4.5 text-primary/80" />
          Studio Project Spaces
        </CardTitle>
        <Button
          onClick={onAddProject}
          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold py-1.5 h-8 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="size-3.5" />
          Initialize Project
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-lg bg-background/20 text-center p-6">
            <FolderKanban className="size-10 text-muted-foreground/30 mb-2" />
            <h3 className="font-semibold text-sm">No project spaces created</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Begin drafting budget pools, address details, and design briefs by setting up this client's first project.
            </p>
            <Button onClick={onAddProject} className="mt-4 flex items-center gap-1.5 text-xs h-8 cursor-pointer">
              <Plus className="size-3.5" />
              Initialize First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.projectId}
                className="group/proj relative flex flex-col gap-3 p-4 rounded-lg border border-border/50 bg-background/50 hover:border-primary/20 hover:shadow-xs transition-all"
              >
                <div
                  className={`absolute top-0 inset-x-0 h-1 bg-linear-to-r rounded-t-lg transition-all ${STATUS_BAR[project.status]}`}
                />
                <div className="flex items-center justify-between mt-1">
                  <h4 className="font-semibold text-base text-foreground leading-tight line-clamp-1 group-hover/proj:text-primary transition-colors">
                    {project.name}
                  </h4>
                  <span
                    className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[project.status]}`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-md border border-muted/30">
                  {project.budget && (
                    <div className="flex items-center gap-1.5 font-medium text-foreground/80">
                      <DollarSign className="size-3.5 text-emerald-500 shrink-0" />
                      Budget: <span className="font-semibold text-foreground/90">{project.budget}</span>
                    </div>
                  )}
                  {project.address && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="size-3.5 text-primary/70 shrink-0" />
                      {project.address}
                    </div>
                  )}
                </div>

                {project.notes && (
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2 italic">
                    "{project.notes}"
                  </p>
                )}

                <div className="border-t border-border/40 pt-2.5 mt-1 flex items-center justify-end">
                  <Link
                    href={`/dashboard/proposals?projectId=${project.projectId}`}
                    prefetch={false}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
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
