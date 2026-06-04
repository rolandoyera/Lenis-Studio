"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  Activity,
  ArrowRight,
  DollarSign,
  Edit3,
  FolderKanban,
  Loader2,
  MapPin,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addProject, deleteProject, getClients, getProjects, updateProject } from "@/lib/db";
import type { Client, Project } from "@/lib/types";

import { EMPTY_PROJECT_FORM, type ProjectFormData, projectToForm } from "./_components/project-constants";
import { ProjectFormDialog } from "./_components/project-form-dialog";

export default function ProjectsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch projects & clients on mount
  useEffect(() => {
    if (authLoading || !profile) return;
    const orgId = profile.organizationId;
    async function loadData() {
      try {
        const [projectsData, clientsData] = await Promise.all([getProjects(orgId), getClients(orgId)]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load projects/clients:", error);
        toast.error("Failed to fetch Projects list from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [profile, authLoading]);

  const handleOpenAdd = () => {
    if (clients.length === 0) {
      toast.warning("Please create a client profile before adding a design project.");
      return;
    }
    setEditingProject(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setIsDialogOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This will detach any associated proposals.")) return;

    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
      toast.success("Design project successfully deleted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete design project.");
    }
  };

  const handleSubmitProject = async (data: ProjectFormData) => {
    if (!profile) return;
    setSubmitting(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.projectId, data);
        setProjects((prev) => prev.map((p) => (p.projectId === editingProject.projectId ? { ...p, ...data } : p)));
        toast.success("Project specifications updated successfully!");
      } else {
        const created = await addProject({
          ...data,
          organizationId: profile.organizationId,
        });
        setProjects((prev) => [created, ...prev]);
        toast.success("New design project space initialized successfully!");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save project.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (!project) return false;
    const parentClient = clients.find((c) => c.uid === project.clientId);

    let clientFirstName = "";
    let clientLastName = "";
    if (parentClient) {
      if (typeof parentClient.firstName === "string" && parentClient.firstName.trim()) {
        clientFirstName = parentClient.firstName.trim();
      } else if (
        typeof (parentClient as { fullName?: string }).fullName === "string" &&
        (parentClient as { fullName?: string }).fullName?.trim()
      ) {
        clientFirstName = (parentClient as { fullName?: string }).fullName?.trim().split(" ")[0] || "";
      }

      if (typeof parentClient.lastName === "string" && parentClient.lastName.trim()) {
        clientLastName = parentClient.lastName.trim();
      } else if (
        typeof (parentClient as { fullName?: string }).fullName === "string" &&
        (parentClient as { fullName?: string }).fullName?.trim()
      ) {
        clientLastName = (parentClient as { fullName?: string }).fullName?.trim().split(" ").slice(1).join(" ") || "";
      }
    }

    const clientName = `${clientFirstName} ${clientLastName}`.trim();
    const term = searchQuery.toLowerCase();

    return (
      (project.name || "").toLowerCase().includes(term) ||
      clientName.toLowerCase().includes(term) ||
      project.address?.toLowerCase().includes(term) ||
      project.notes?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header section with Premium typography & Action trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold font-heading text-3xl tracking-tight">Design Projects</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Initialize remodeling spaces, manage budgets, track sites, and build targeted sourcing proposal contracts.
          </p>
        </div>

        {clients.length === 0 ? (
          <Link href="/dashboard/clients" prefetch={false}>
            <Button className="flex items-center gap-2 border border-primary/30 bg-primary/20 text-primary hover:bg-primary/30 sm:self-start">
              <PlusCircle className="size-4" />
              Add Client Roster First
            </Button>
          </Link>
        ) : (
          <Button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 sm:self-start"
          >
            <Plus className="size-4" />
            Start Project
          </Button>
        )}
      </div>

      {/* Quick search input */}
      <div className="relative w-full max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search project title, client parent, or sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-background/50 pl-9"
        />
      </div>

      {/* Loading or Visual Grid Cards */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Loading Project spaces</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center border-dashed bg-background/30 p-8 text-center">
          <FolderKanban className="mb-3 size-12 text-muted-foreground/40" />
          <h3 className="font-semibold text-lg">No projects active</h3>
          <p className="mt-1 max-w-sm text-muted-foreground text-sm">
            {searchQuery
              ? "Try broadening your search query or clear the filter."
              : "Get started by initializing your first client project space (e.g. Master Living Room Renovation)."}
          </p>
          {!searchQuery && clients.length > 0 && (
            <Button onClick={handleOpenAdd} className="mt-4 flex items-center gap-2">
              <Plus className="size-4" />
              Initialize Project Space
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const parentClient = clients.find((c) => c.uid === project.clientId);

            return (
              <Card
                key={project.projectId}
                className="group relative overflow-hidden bg-card/60 backdrop-blur-xs transition-all duration-300 hover:border-primary/20 hover:shadow-md"
              >
                {/* Subtle top-bar indicator color matches active project status */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r transition-all ${
                    project.status === "Active"
                      ? "from-emerald-500/40 via-emerald-500/10 to-transparent"
                      : project.status === "Completed"
                        ? "from-blue-500/40 via-blue-500/10 to-transparent"
                        : "from-amber-500/40 via-amber-500/10 to-transparent"
                  }`}
                />

                <CardHeader className="flex flex-col gap-1.5 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Status Badge */}
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider ${
                        project.status === "Active"
                          ? "border border-emerald-500/20 bg-emerald-500/15 text-emerald-500"
                          : project.status === "Completed"
                            ? "border border-blue-500/20 bg-blue-500/15 text-blue-500"
                            : "border border-amber-500/20 bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {project.status}
                    </span>

                    {/* Absolute positioning edit/delete action tray on hover */}
                    <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(project)}
                        className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(project.projectId)}
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <CardTitle className="line-clamp-1 font-heading font-semibold text-lg leading-tight transition-colors group-hover:text-primary">
                    {project.name}
                  </CardTitle>

                  {parentClient ? (
                    <CardDescription className="flex items-center gap-1.5 truncate text-muted-foreground text-xs">
                      <User className="size-3 shrink-0 text-muted-foreground/60" />
                      Client:{" "}
                      <span className="font-medium text-foreground/80">
                        {(() => {
                          let f = "";
                          if (typeof parentClient.firstName === "string" && parentClient.firstName.trim()) {
                            f = parentClient.firstName.trim();
                          } else if (
                            typeof (parentClient as { fullName?: string }).fullName === "string" &&
                            (parentClient as { fullName?: string }).fullName?.trim()
                          ) {
                            f = (parentClient as { fullName?: string }).fullName?.trim().split(" ")[0] || "";
                          }

                          let l = "";
                          if (typeof parentClient.lastName === "string" && parentClient.lastName.trim()) {
                            l = parentClient.lastName.trim();
                          } else if (
                            typeof (parentClient as { fullName?: string }).fullName === "string" &&
                            (parentClient as { fullName?: string }).fullName?.trim()
                          ) {
                            l =
                              (parentClient as { fullName?: string }).fullName?.trim().split(" ").slice(1).join(" ") ||
                              "";
                          }

                          return `${f} ${l}`.trim() || "Unnamed Client";
                        })()}
                      </span>
                    </CardDescription>
                  ) : (
                    <CardDescription className="text-muted-foreground/50 text-xs italic">
                      Client contact missing
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col gap-3.5 pt-0 text-sm">
                  {/* Space & site details */}
                  <div className="flex flex-col gap-2 rounded-lg border border-muted/50 bg-muted/30 p-3">
                    {project.budget && (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <DollarSign className="size-3.5 shrink-0 text-emerald-500" />
                        Budget Pool: <span className="font-semibold text-foreground/80">{project.budget}</span>
                      </div>
                    )}
                    {project.address && (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <MapPin className="size-3.5 shrink-0 text-primary/70" />
                        <span className="truncate">{project.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Project briefs / description */}
                  {project.notes && (
                    <p className="line-clamp-3 rounded-md border border-border/50 bg-background/30 p-2.5 text-muted-foreground text-xs leading-relaxed">
                      {project.notes}
                    </p>
                  )}

                  {/* Navigation shortcut to Proposals */}
                  <div className="mt-1 flex items-center justify-between border-border/40 border-t pt-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Activity className="size-3.5 text-primary/70" />
                      Assigned Proposals:
                    </span>
                    <Link
                      href={`/dashboard/proposals?projectId=${project.projectId}`}
                      prefetch={false}
                      className="group/btn flex items-center gap-0.5 font-semibold text-primary hover:underline"
                    >
                      View Proposals
                      <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <ProjectFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={editingProject ? "edit" : "add"}
        submitting={submitting}
        clients={clients}
        initialData={
          editingProject ? projectToForm(editingProject) : { ...EMPTY_PROJECT_FORM, clientId: clients[0]?.uid ?? "" }
        }
        onSubmit={handleSubmitProject}
      />
    </div>
  );
}
