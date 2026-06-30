"use client";

import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";

interface ProjectBriefCardProps {
  project: Project;
  onEdit: () => void;
}

export function ProjectBriefCard({ project, onEdit }: ProjectBriefCardProps) {
  return (
    <Card variant="panel">
      <CardHeader>
        <CardTitle>
          <FileText className="icons" />
          Project Brief
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 text-sm">
        {project.brief?.trim() ? (
          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {project.brief}
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <p className="text-xs italic">
              No project briefs or goals recorded yet.
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={onEdit}
              className="mt-1 h-auto p-0 font-medium"
            >
              Add Project Brief
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
