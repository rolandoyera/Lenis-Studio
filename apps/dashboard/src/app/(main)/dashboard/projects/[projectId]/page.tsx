"use client";

import { use, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { PageTitle } from "@/components/page-title-updater";
import { Card } from "@/components/ui/card";
import {
  addProposal,
  deleteProject,
  getClients,
  getProject,
  getProposals,
  updateProject,
} from "@/lib/db";
import type { Client, Project, Proposal } from "@/lib/types";

import { DeleteProjectDialog } from "../_components/delete-project-dialog";
import {
  isProjectTab,
  type ProjectFormData,
  type ProjectTab,
  projectToForm,
} from "../_components/project-constants";
import { ProjectFormDialog } from "../_components/project-form-dialog";
import { ProjectHeader } from "../_components/project-header";
import { ProjectFilesCard } from "../_components/project-files-card";
import { ProjectInformationCard } from "../_components/project-information-card";
import { ProjectNotesCard } from "../_components/project-notes-card";
import { ProjectProposalsCard } from "../_components/project-proposals-card";
import { ProjectItems } from "../tabs/project-items";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, organizationId, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<ProjectTab>(
    isProjectTab(tabParam) ? tabParam : "overview",
  );

  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updatingProject, setUpdatingProject] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [addingProposal, setAddingProposal] = useState(false);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dependency; profile object identity churns on each heartbeat

    async function loadProjectData() {
      try {
        const [projectData, clientsData, proposalsData] = await Promise.all([
          getProject(projectId),
          getClients(orgId),
          getProposals(orgId),
        ]);

        if (!projectData || projectData.organizationId !== orgId) {
          toast.error("Project not found.");
          router.push("/dashboard/projects");
          return;
        }

        setProject(projectData);
        setClients(clientsData);

        const parentClient =
          clientsData.find((c) => c.uid === projectData.clientId) || null;
        setClient(parentClient);

        // Filter proposals for this project
        setProposals(proposalsData.filter((p) => p.projectId === projectId));
      } catch (error) {
        console.error("Failed to load project details:", error);
        toast.error("Failed to retrieve project info.");
      } finally {
        setLoading(false);
      }
    }
    void loadProjectData();
  }, [projectId, router, organizationId, authLoading]);

  const handleTabChange = (tab: ProjectTab) => {
    setActiveTab(tab);
    // Keep the URL in sync so refresh and copied links land on the same tab.
    const url =
      tab === "overview"
        ? `/dashboard/projects/${projectId}`
        : `/dashboard/projects/${projectId}?tab=${tab}`;
    window.history.replaceState(null, "", url);
  };

  const handleEditSubmit = async (data: ProjectFormData) => {
    if (!project || !profile) return;
    setUpdatingProject(true);
    try {
      const updatedFields = await updateProject(project.projectId, {
        ...data,
        updatedBy: profile.uid,
      });

      // Apply the exact normalized fields the server wrote (audit stamps included).
      setProject({ ...project, ...updatedFields });

      const parentClient = clients.find((c) => c.uid === data.clientId) || null;
      setClient(parentClient);

      setIsEditOpen(false);
      toast.success("Project specifications updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update project details.");
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleAddProposal = async () => {
    if (!profile || !project) return;
    setAddingProposal(true);
    try {
      const created = await addProposal({
        organizationId: profile.organizationId,
        projectId: project.projectId,
        clientId: project.clientId,
        title: `Draft - ${project.name}`,
        status: "Draft",
        lineItems: [],
        subtotal: 0,
        taxRate: 8.25,
        taxTotal: 0,
        grandTotal: 0,
      });
      toast.success("New proposal successfully initialized!");
      router.push(`/dashboard/proposals/${created.proposalId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize proposal document.");
    } finally {
      setAddingProposal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!project) return;
    setDeletingProject(true);
    try {
      await deleteProject(project.projectId);
      toast.success("Project permanently deleted!");
      router.push("/dashboard/projects");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project.");
    } finally {
      setDeletingProject(false);
      setIsDeleteOpen(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Fetching Project Specifications
        </p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <>
      <PageTitle title={`${project.name} | Project Profile`} />
      <div className="flex w-full flex-col gap-6">
        <ProjectHeader
          project={project}
          client={client}
          activeTab={activeTab}
          onTabChange={(tab) => handleTabChange(tab as ProjectTab)}
          onEdit={() => setIsEditOpen(true)}
          onRequestDelete={() => setIsDeleteOpen(true)}
        />

        {/* Tab 1 Page Content - Project Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <ProjectInformationCard project={project} client={client} />
            <ProjectProposalsCard
              proposals={proposals}
              onAddProposal={handleAddProposal}
              addingProposal={addingProposal}
            />
            <ProjectNotesCard
              project={project}
              onEdit={() => setIsEditOpen(true)}
            />
          </div>
        )}

        {/* Tab 2 Page Content - Project Items */}
        {activeTab === "items" && <ProjectItems project={project} />}

        {/* Tab 3 Page Content - Project Files */}
        {activeTab === "files" && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <ProjectFilesCard
              projectId={project.projectId}
              organizationId={project.organizationId}
            />
          </div>
        )}

        {/* Tab 4 Page Content - Project Invoices */}
        {activeTab === "invoices" && <TabPlaceholder label="Invoices" />}

        {/* Tab 5 Page Content - Project Settings */}
        {activeTab === "settings" && <TabPlaceholder label="Settings" />}

        <ProjectFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          mode="edit"
          submitting={updatingProject}
          clients={clients}
          initialData={projectToForm(project)}
          onSubmit={handleEditSubmit}
        />

        <DeleteProjectDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          projectName={project.name}
          deleting={deletingProject}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </>
  );
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <Card className="flex min-h-[300px] flex-col items-center justify-center border-dashed bg-background/30 p-8 text-center">
      <h3 className="font-semibold text-lg">{label} coming soon</h3>
      <p className="mt-1 max-w-sm text-muted-foreground text-sm">
        This section is not available yet.
      </p>
    </Card>
  );
}
