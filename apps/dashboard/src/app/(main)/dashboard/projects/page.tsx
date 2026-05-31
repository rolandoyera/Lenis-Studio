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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addProject, deleteProject, getClients, getProjects, updateProject } from "@/lib/db";
import type { Client, Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    name: "",
    address: "",
    status: "Active" as "Active" | "Completed" | "Paused",
    budget: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch projects & clients on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [projectsData, clientsData] = await Promise.all([getProjects(), getClients()]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load projects/clients:", error);
        toast.error("Failed to fetch Projects list from database.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (clients.length === 0) {
      toast.warning("Please create a client profile before adding a design project.");
      return;
    }
    setEditingProject(null);
    setFormData({
      clientId: clients[0]?.uid || "",
      name: "",
      address: "",
      status: "Active",
      budget: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      clientId: project.clientId,
      name: project.name,
      address: project.address || "",
      status: project.status,
      budget: project.budget || "",
      notes: project.notes || "",
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.clientId) {
      toast.error("Project name and parent client are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingProject) {
        // Update
        await updateProject(editingProject.projectId, formData);
        setProjects((prev) => prev.map((p) => (p.projectId === editingProject.projectId ? { ...p, ...formData } : p)));
        toast.success("Project specifications updated successfully!");
      } else {
        // Create
        const created = await addProject(formData);
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
        (parentClient as { fullName?: string }).fullName!.trim()
      ) {
        clientFirstName = (parentClient as { fullName?: string }).fullName!.trim().split(" ")[0] || "";
      }

      if (typeof parentClient.lastName === "string" && parentClient.lastName.trim()) {
        clientLastName = parentClient.lastName.trim();
      } else if (
        typeof (parentClient as { fullName?: string }).fullName === "string" &&
        (parentClient as { fullName?: string }).fullName!.trim()
      ) {
        clientLastName = (parentClient as { fullName?: string }).fullName!.trim().split(" ").slice(1).join(" ") || "";
      }
    }

    const clientName = `${clientFirstName} ${clientLastName}`.trim();
    const term = searchQuery.toLowerCase();

    return (
      (project.name || "").toLowerCase().includes(term) ||
      clientName.toLowerCase().includes(term) ||
      (project.address && project.address.toLowerCase().includes(term)) ||
      (project.notes && project.notes.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header section with Premium typography & Action trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Design Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Initialize remodeling spaces, manage budgets, track sites, and build targeted sourcing proposal contracts.
          </p>
        </div>

        {clients.length === 0 ? (
          <Link href="/dashboard/clients" prefetch={false}>
            <Button className="sm:self-start bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-2 border border-primary/30">
              <PlusCircle className="size-4" />
              Add Client Roster First
            </Button>
          </Link>
        ) : (
          <Button
            onClick={handleOpenAdd}
            className="sm:self-start bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
          >
            <Plus className="size-4" />
            Start Project
          </Button>
        )}
      </div>

      {/* Quick search input */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="Search project title, client parent, or sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      {/* Loading or Visual Grid Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Loading Project spaces</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] border-dashed text-center p-8 bg-background/30">
          <FolderKanban className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg">No projects active</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const parentClient = clients.find((c) => c.uid === project.clientId);

            return (
              <Card
                key={project.projectId}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 bg-card/60 backdrop-blur-xs"
              >
                {/* Subtle top-bar indicator color matches active project status */}
                <div
                  className={`absolute top-0 inset-x-0 h-1 bg-linear-to-r transition-all ${
                    project.status === "Active"
                      ? "from-emerald-500/40 via-emerald-500/10 to-transparent"
                      : project.status === "Completed"
                        ? "from-blue-500/40 via-blue-500/10 to-transparent"
                        : "from-amber-500/40 via-amber-500/10 to-transparent"
                  }`}
                />

                <CardHeader className="pb-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                        project.status === "Active"
                          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                          : project.status === "Completed"
                            ? "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                            : "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {project.status}
                    </span>

                    {/* Absolute positioning edit/delete action tray on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(project)}
                        className="hover:bg-primary/10 hover:text-primary text-muted-foreground"
                      >
                        <Edit3 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(project.projectId)}
                        className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <CardTitle className="font-heading text-lg font-semibold group-hover:text-primary transition-colors leading-tight line-clamp-1">
                    {project.name}
                  </CardTitle>

                  {parentClient ? (
                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                      <User className="size-3 text-muted-foreground/60 shrink-0" />
                      Client:{" "}
                      <span className="font-medium text-foreground/80">
                        {(() => {
                          let f = "";
                          if (typeof parentClient.firstName === "string" && parentClient.firstName.trim()) {
                            f = parentClient.firstName.trim();
                          } else if (
                            typeof (parentClient as { fullName?: string }).fullName === "string" &&
                            (parentClient as { fullName?: string }).fullName!.trim()
                          ) {
                            f = (parentClient as { fullName?: string }).fullName!.trim().split(" ")[0] || "";
                          }

                          let l = "";
                          if (typeof parentClient.lastName === "string" && parentClient.lastName.trim()) {
                            l = parentClient.lastName.trim();
                          } else if (
                            typeof (parentClient as { fullName?: string }).fullName === "string" &&
                            (parentClient as { fullName?: string }).fullName!.trim()
                          ) {
                            l =
                              (parentClient as { fullName?: string }).fullName!.trim().split(" ").slice(1).join(" ") ||
                              "";
                          }

                          return `${f} ${l}`.trim() || "Unnamed Client";
                        })()}
                      </span>
                    </CardDescription>
                  ) : (
                    <CardDescription className="text-xs text-muted-foreground/50 italic">
                      Client contact missing
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col gap-3.5 text-sm pt-0">
                  {/* Space & site details */}
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/30 border border-muted/50 p-3">
                    {project.budget && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="size-3.5 shrink-0 text-emerald-500" />
                        Budget Pool: <span className="font-semibold text-foreground/80">{project.budget}</span>
                      </div>
                    )}
                    {project.address && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0 text-primary/70" />
                        <span className="truncate">{project.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Project briefs / description */}
                  {project.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 bg-background/30 p-2.5 rounded-md border border-border/50">
                      {project.notes}
                    </p>
                  )}

                  {/* Navigation shortcut to Proposals */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1 text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Activity className="size-3.5 text-primary/70" />
                      Assigned Proposals:
                    </span>
                    <Link
                      href={`/dashboard/proposals?projectId=${project.projectId}`}
                      prefetch={false}
                      className="font-semibold text-primary flex items-center gap-0.5 hover:underline group/btn"
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md lg:max-w-2xl bg-popover/95 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingProject ? "Edit Project Specifications" : "Initialize Design Project"}
              </DialogTitle>
              <DialogDescription>
                Assign the project to a client, define budgets, and specify design addresses.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-8 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Parent Client <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  {clients.map((client) => (
                    <option key={client.uid} value={client.uid}>
                      {client.firstName} {client.lastName} {client.company ? `(${client.company})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Project Title <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Penthouse Living Room, Coastal Kitchen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    Project Budget Pool
                  </label>
                  <Input
                    placeholder="e.g. $150,000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "Active" | "Completed" | "Paused",
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Site / Shipping Address
                </label>
                <Input
                  placeholder="e.g. 100 Ocean Drive, Newport, RI"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Project Brief & Goals
                </label>
                <Textarea
                  placeholder="Warm organic minimalism, marble accent walls, gold hardware finish accents..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {editingProject ? "Save Specifications" : "Initialize Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
