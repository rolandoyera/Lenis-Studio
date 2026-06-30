"use client";

import { Edit, FolderKanban, MoreVertical, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  TooltipDropdownMenu,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H1 } from "@/components/ui/typography";
import type { Client, Project } from "@/lib/types";

import HeaderBackLink from "../../_components/HeaderBackLink";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_VARIANT,
  PROJECT_TABS,
} from "./project-constants";

interface ProjectHeaderProps {
  project: Project;
  client: Client | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEdit: () => void;
  onRequestDelete: () => void;
}

export function ProjectHeader({
  project,
  activeTab,
  onTabChange,
  onEdit,
  onRequestDelete,
}: ProjectHeaderProps) {
  return (
    <>
      <HeaderBackLink href="/dashboard/projects" />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-16 md:flex-row md:items-start">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-xs">
              <FolderKanban className="size-6" />
            </div>
            <div>
              <H1>{project.name}</H1>
              <Badge
                variant={PROJECT_STATUS_VARIANT[project.status]}
                className="px-0"
              >
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
          </div>

          <TooltipDropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
                <span className="sr-only">Actions Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="size-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onRequestDelete}>
                <Trash2 className="size-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </TooltipDropdownMenu>
        </div>
        {/* Tab group here */}
        <Tabs
          value={activeTab}
          onValueChange={onTabChange}
          className="w-full md:w-auto"
        >
          <TabsList className="flex max-w-full flex-wrap gap-1.5">
            {PROJECT_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </>
  );
}
