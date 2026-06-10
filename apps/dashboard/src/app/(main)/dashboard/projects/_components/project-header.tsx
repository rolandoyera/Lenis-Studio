"use client";

import Link from "next/link";

import {
  Calendar,
  Edit3,
  FolderKanban,
  MoreVertical,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipDropdownMenu,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H1 } from "@/components/ui/typography";
import type { Client, Project } from "@/lib/types";

import HeaderBackLink from "../../_components/HeaderBackLink";
import { PROJECT_TABS } from "./project-constants";

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

      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center justify-between">
        <div className="flex flex-col gap-16 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-xs">
              <FolderKanban className="size-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <H1>{project.name}</H1>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider ${
                    project.status === "Active"
                      ? "border border-emerald-500/20 bg-emerald-500/15 text-emerald-500"
                      : project.status === "Completed"
                        ? "border border-blue-500/20 bg-blue-500/15 text-blue-500"
                        : "border border-amber-500/20 bg-amber-500/15 text-amber-500"
                  }`}>
                  {project.status}
                </span>
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
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="size-4" />
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
