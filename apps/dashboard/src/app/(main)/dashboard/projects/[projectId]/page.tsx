"use client";

import { use, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { PageTitle } from "@/components/page-title-updater";
import { addProposal, deleteProject, getClients, getProject, getProposals, updateProject } from "@/lib/db";
import type { Client, Project, Proposal } from "@/lib/types";

import { DeleteProjectDialog } from "../_components/delete-project-dialog";
import { type ProjectFormData, projectToForm } from "../_components/project-constants";
import { ProjectDetailHeader } from "../_components/project-detail-header";
import { ProjectFormDialog } from "../_components/project-form-dialog";
import { ProjectInformationCard } from "../_components/project-information-card";
import { ProjectNotesCard } from "../_components/project-notes-card";
import { ProjectProposalsCard } from "../_components/project-proposals-card";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = use(params);
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updatingProject, setUpdatingProject] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [addingProposal, setAddingProposal] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    const orgId = profile.organizationId;

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

        const parentClient = clientsData.find((c) => c.uid === projectData.clientId) || null;
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
  }, [projectId, router, profile, authLoading]);

  const handleEditSubmit = async (data: ProjectFormData) => {
    if (!project) return;
    setUpdatingProject(true);
    try {
      await updateProject(project.projectId, data);

      const updatedProject: Project = {
        ...project,
        ...data,
      };

      // Update address fields to match project update address conversion logic
      const address = [data.street, [data.city, data.state].filter(Boolean).join(", "), data.zip]
        .filter(Boolean)
        .join(" ");
      if (address) {
        updatedProject.address = address;
      }

      setProject(updatedProject);

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
      toast.success("Project space permanently deleted!");
      router.push("/dashboard/projects");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project space.");
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
      <div className="flex w-full flex-col gap-6 pb-10">
        <ProjectDetailHeader
          project={project}
          client={client}
          onEdit={() => setIsEditOpen(true)}
          onRequestDelete={() => setIsDeleteOpen(true)}
        />

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <ProjectProposalsCard
              proposals={proposals}
              onAddProposal={handleAddProposal}
              addingProposal={addingProposal}
            />
            <ProjectNotesCard project={project} onEdit={() => setIsEditOpen(true)} />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-5">
            <ProjectInformationCard project={project} client={client} />
          </div>
        </div>

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
