"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Briefcase, FolderKanban, Loader2, Mail, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { PageTitle } from "@/components/page-title-updater";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { H1 } from "@/components/ui/typography";
import { addClient, getClients, getProjects } from "@/lib/db";
import type { Client, Project } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

import type { ClientFormData } from "./_components/client-constants";
import { ClientFormDialog } from "./_components/client-form-dialog";

export default function ClientsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    const orgId = profile.organizationId;

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("add") === "true") {
        setIsDialogOpen(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }

    async function loadData() {
      try {
        const [clientsData, projectsData] = await Promise.all([getClients(orgId), getProjects(orgId)]);
        setClients(clientsData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Failed to load clients/projects:", error);
        toast.error("Failed to fetch CRM contacts from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [profile, authLoading]);

  const handleAddSubmit = async (data: ClientFormData) => {
    if (!profile) return;
    if (!data.firstName.trim() || !data.lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await addClient({
        ...data,
        organizationId: profile.organizationId,
      });
      setClients((prev) => [created, ...prev]);
      toast.success("New client contact created successfully!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save client details.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    if (!client) return false;
    const term = searchQuery.toLowerCase();

    let firstName = "";
    if (typeof client.firstName === "string" && client.firstName.trim()) {
      firstName = client.firstName.trim();
    } else if (
      typeof (client as { fullName?: string }).fullName === "string" &&
      (client as { fullName?: string }).fullName?.trim()
    ) {
      firstName = (client as { fullName?: string }).fullName?.trim().split(" ")[0] || "";
    }

    let lastName = "";
    if (typeof client.lastName === "string" && client.lastName.trim()) {
      lastName = client.lastName.trim();
    } else if (
      typeof (client as { fullName?: string }).fullName === "string" &&
      (client as { fullName?: string }).fullName?.trim()
    ) {
      lastName = (client as { fullName?: string }).fullName?.trim().split(" ").slice(1).join(" ") || "";
    }

    const email = typeof client.email === "string" ? client.email : "";
    const company = typeof client.company === "string" ? client.company : "";
    const notes = typeof client.notes === "string" ? client.notes : "";

    return (
      firstName.toLowerCase().includes(term) ||
      lastName.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      company.toLowerCase().includes(term) ||
      notes.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <PageTitle title="Client Directory" />
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <H1>Client Directory</H1>
            <p className="mt-1 text-muted-foreground text-sm">
              Manage your design clients, corporate account brief contracts, and multi-project relationships.
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 sm:self-start"
          >
            <Plus className="size-4" />
            Add Client Profile
          </Button>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search client directory by name, email or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background/50 pl-9"
          />
        </div>

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Loading Clients Directory
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="flex min-h-[300px] flex-col items-center justify-center border-dashed bg-background/30 p-8 text-center">
            <Users className="mb-3 size-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-lg">No clients found</h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-sm">
              {searchQuery
                ? "Try broadening your search query or clear the filter."
                : "Create your first client contact sheet to start attaching design projects."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4 flex items-center gap-2">
                <Plus className="size-4" />
                Add Client profile
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredClients.map((client) => {
              let firstName = "";
              if (typeof client.firstName === "string" && client.firstName.trim()) {
                firstName = client.firstName.trim();
              } else if (
                typeof (client as { fullName?: string }).fullName === "string" &&
                (client as { fullName?: string }).fullName?.trim()
              ) {
                firstName = (client as { fullName?: string }).fullName?.trim().split(" ")[0] || "";
              }

              let lastName = "";
              if (typeof client.lastName === "string" && client.lastName.trim()) {
                lastName = client.lastName.trim();
              } else if (
                typeof (client as { fullName?: string }).fullName === "string" &&
                (client as { fullName?: string }).fullName?.trim()
              ) {
                lastName = (client as { fullName?: string }).fullName?.trim().split(" ").slice(1).join(" ") || "";
              }

              const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "?";
              const clientProjects = projects.filter((p) => p.clientId === client.uid);

              return (
                <Link href={`/dashboard/clients/${client.uid}`} key={client.uid} className="block">
                  <Card className="group relative h-full cursor-pointer overflow-hidden bg-card/60 backdrop-blur-xs transition-all duration-300 hover:border-primary/20 hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/30 via-primary/10 to-transparent" />

                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 font-bold text-lg text-primary">
                        {initials.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate font-heading font-semibold text-lg transition-colors group-hover:text-primary">
                          {firstName} {lastName}
                        </CardTitle>
                        {client.company ? (
                          <p className="mt-0.5 flex items-center gap-1 truncate font-medium text-muted-foreground text-xs">
                            <Briefcase className="size-3 text-muted-foreground/60" />
                            {client.company}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-muted-foreground/50 text-xs italic">Private Residence</p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3 text-sm">
                      <div className="flex flex-col gap-1.5 rounded-md border border-muted/50 bg-muted/30 p-2.5 text-muted-foreground text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="size-3.5 shrink-0" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 truncate">
                            <Phone className="size-3.5 shrink-0" />
                            {formatPhone(client.phone)}
                          </div>
                        )}
                        {(client.city || client.state) && (
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="size-3.5 shrink-0 text-muted-foreground/85" />
                            <span className="truncate">{[client.city, client.state].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between border-border/40 border-t pt-2.5 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <FolderKanban className="size-3.5 text-primary/70" />
                          Active Projects:
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                          {clientProjects.length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <ClientFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title="Add Client Profile"
          description="Input client contacts, optional company settings, and design preferences."
          submitLabel="Create Profile"
          submitting={submitting}
          onSubmit={handleAddSubmit}
        />
      </div>
    </>
  );
}
