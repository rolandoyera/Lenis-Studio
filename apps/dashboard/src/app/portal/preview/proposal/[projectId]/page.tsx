"use client";

import { use, useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth-context";
import { resolveAppBrand } from "@/config/app-config";
import {
  getClient,
  getOrganization,
  getProject,
  getProjectRoomItems,
  getProjectRooms,
  getVendors,
} from "@/lib/db";
import type {
  Client,
  Organization,
  Project,
  ProjectRoom,
  ProjectRoomItem,
  Vendor,
} from "@/lib/types";

import { PortalShell } from "../../../_components/portal-shell";
import { ProposalDocument } from "./_components/proposal-document";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProposalPreviewPage({ params }: PageProps) {
  const { projectId } = use(params);
  const { organizationId, loading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [rooms, setRooms] = useState<ProjectRoom[]>([]);
  const [items, setItems] = useState<ProjectRoomItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dependency; profile identity churns

    let active = true;
    async function load() {
      try {
        const [
          projectData,
          organizationData,
          roomsData,
          itemsData,
          vendorsData,
        ] = await Promise.all([
          getProject(projectId),
          getOrganization(orgId),
          getProjectRooms(projectId),
          getProjectRoomItems(projectId),
          getVendors(orgId),
        ]);
        if (!active) return;

        if (!projectData || projectData.organizationId !== orgId) {
          setNotFound(true);
          return;
        }

        setProject(projectData);
        setOrganization(organizationData);
        setRooms(roomsData);
        setItems(itemsData);
        setVendors(vendorsData);
        const clientData = await getClient(projectData.clientId);
        if (active) setClient(clientData);
      } catch (error) {
        console.error("Failed to load proposal preview:", error);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [projectId, organizationId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-neutral-100 text-neutral-500">
        <Loader2 className="size-8 animate-spin" />
        <p className="font-medium text-xs uppercase tracking-wider">
          Building Proposal Preview
        </p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 bg-neutral-100 px-4 text-center text-neutral-600">
        <p className="font-medium">Proposal preview unavailable</p>
        <p className="text-neutral-500 text-sm">
          This project couldn't be found, or you don't have access to it.
        </p>
      </div>
    );
  }

  // Same host-resolved app brand the contract portal renders (resolved client-side
  // here, where this preview always runs after auth/data load).
  const brand = resolveAppBrand(
    typeof window !== "undefined" ? window.location.host : null,
  );

  return (
    <PortalShell brand={brand} branding={organization?.branding}>
      <ProposalDocument
        project={project}
        client={client}
        organization={organization}
        rooms={rooms}
        items={items}
        vendors={vendors}
      />
    </PortalShell>
  );
}
