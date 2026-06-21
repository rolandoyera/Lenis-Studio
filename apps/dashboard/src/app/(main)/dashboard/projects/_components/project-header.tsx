"use client";

import Link from "next/link";

import {
  Calendar,
  Edit,
  FolderKanban,
  MoreVertical,
  Trash2,
  User,
} from "lucide-react";

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
  client,
  activeTab,
  onTabChange,
  onEdit,
  onRequestDelete,
}: ProjectHeaderProps) {
  let clientName = "Unnamed Client";
  if (client) {
    const firstName = client.firstName?.trim() || "";
    const lastName = client.lastName?.trim() || "";
    clientName =
      `${firstName} ${lastName}`.trim() || client.company || "Unnamed Client";
  }

  return (
    <>
      <HeaderBackLink href="/dashboard/projects" />

      <div className="flex flex-col justify-between gap-4 pb-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-16 md:flex-row md:items-start">
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-xs">
              <FolderKanban className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <H1>{project.name}</H1>
                <Badge variant={PROJECT_STATUS_VARIANT[project.status]}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium text-muted-foreground text-sm">
                {client ? (
                  <Link
                    href={`/dashboard/clients/${client.uid}`}
                    prefetch={false}
                    className="flex items-center gap-1 hover:text-primary hover:underline">
                    <User className="size-3.5 text-muted-foreground/80" />
                    Client: {clientName}
                  </Link>
                ) : (
                  <span className="text-muted-foreground/60 italic">
                    No Client Assigned
                  </span>
                )}
                <span className="text-muted-foreground/30">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 text-muted-foreground/80" />
                  Created{" "}
                  {new Date(project.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
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
          className="w-full md:w-auto">
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
