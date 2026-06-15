"use client";

import { use, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { addProject, deleteClient, getClient, getProjects, updateClient } from "@/lib/db";
import type { Client, Project } from "@/lib/types";

import type { ProjectFormData } from "../../projects/_components/project-constants";
import { ProjectFormDialog } from "../../projects/_components/project-form-dialog";
import type { ClientFormData } from "../_components/client-constants";
import { ClientContactCard } from "../_components/client-contact-card";
import { ClientDetailHeader } from "../_components/client-detail-header";
import { ClientFormDialog } from "../_components/client-form-dialog";
import { getClientName } from "../_components/client-name";
import { ClientNotesCard } from "../_components/client-notes-card";
import { ClientProjectsCard } from "../_components/client-projects-card";
import { DeleteClientDialog } from "../_components/delete-client-dialog";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default function ClientProfilePage({ params }: PageProps) {
  const { clientId } = use(params);
  const router = useRouter();
  const { profile, organizationId, loading: authLoading } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [addingProject, setAddingProject] = useState(false);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dependency; profile object identity churns on each heartbeat

    async function loadClientData() {
      try {
        const [clientData, projectsData] = await Promise.all([getClient(clientId), getProjects(orgId)]);

        if (!clientData || clientData.organizationId !== orgId) {
          toast.error("Client profile not found.");
          router.push("/dashboard/clients");
          return;
        }

        setClient(clientData);
        setProjects(projectsData.filter((p) => p.clientId === clientId));
      } catch (error) {
        console.error("Failed to load client details:", error);
        toast.error("Failed to retrieve client credentials from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadClientData();
  }, [clientId, router, organizationId, authLoading]);

  const handleEditSubmit = async (data: ClientFormData) => {
    if (!client) return;
    if (!data.firstName.trim() || !data.lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    setUpdatingProfile(true);
    try {
      const { isCompany, ...clientData } = data;
      await updateClient(client.uid, clientData);
      setClient({ ...client, ...clientData });
      setIsEditOpen(false);
      toast.success("Client profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update client details.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddProject = async (data: ProjectFormData) => {
    if (!profile) return;
    setAddingProject(true);
    try {
      const created = await addProject({
        ...data,
        organizationId: profile.organizationId,
      });
      setProjects((prev) => [created, ...prev]);
      setIsAddProjectOpen(false);
      toast.success("New design project successfully mapped to this client!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize design project space.");
    } finally {
      setAddingProject(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!client) return;
    setDeletingProfile(true);
    try {
      await deleteClient(client.uid);
      toast.success("Client profile successfully removed from studio roster!");
      router.push("/dashboard/clients");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete client contact.");
    } finally {
      setDeletingProfile(false);
      setIsDeleteAlertOpen(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Fetching Client Specifications
        </p>
      </div>
    );
  }

  if (!client) return null;

  const { firstName, lastName } = getClientName(client);
  const clientName = `${firstName} ${lastName}`.trim() || "Unnamed Client";

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <ClientDetailHeader
        client={client}
        onEdit={() => setIsEditOpen(true)}
        onRequestDelete={() => setIsDeleteAlertOpen(true)}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <ClientProjectsCard projects={projects} onAddProject={() => setIsAddProjectOpen(true)} />
          <ClientNotesCard client={client} onEdit={() => setIsEditOpen(true)} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-5">
          <ClientContactCard client={client} />
        </div>
      </div>

      <ClientFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Client Profile"
        description="Modify client contacts and optional company settings."
        submitLabel="Save Changes"
        submitting={updatingProfile}
        defaultValues={{
          firstName,
          lastName,
          email: client.email || "",
          phone: client.phone ?? "",
          company: client.company ?? "",
          taxId: client.taxId ?? "",
          taxable: client.taxable ?? true,
          street: client.street ?? "",
          city: client.city ?? "",
          state: client.state ?? "",
          zip: client.zip ?? "",
          notes: client.notes ?? "",
        }}
        onSubmit={handleEditSubmit}
      />

      <ProjectFormDialog
        open={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        mode="add"
        submitting={addingProject}
        lockedClientId={client.uid}
        clientName={clientName}
        clients={[client]}
        onSubmit={handleAddProject}
      />

      <DeleteClientDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        clientName={clientName}
        deleting={deletingProfile}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
