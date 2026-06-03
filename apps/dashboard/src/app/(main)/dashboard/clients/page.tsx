"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Briefcase, FolderKanban, Loader2, Mail, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

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
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
        const [clientsData, projectsData] = await Promise.all([getClients(), getProjects()]);
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
  }, []);

  const handleAddSubmit = async (data: ClientFormData) => {
    if (!data.firstName.trim() || !data.lastName.trim()) {
      toast.error("First name and last name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await addClient(data);
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
      (client as { fullName?: string }).fullName!.trim()
    ) {
      firstName = (client as { fullName?: string }).fullName!.trim().split(" ")[0] || "";
    }

    let lastName = "";
    if (typeof client.lastName === "string" && client.lastName.trim()) {
      lastName = client.lastName.trim();
    } else if (
      typeof (client as { fullName?: string }).fullName === "string" &&
      (client as { fullName?: string }).fullName!.trim()
    ) {
      lastName = (client as { fullName?: string }).fullName!.trim().split(" ").slice(1).join(" ") || "";
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
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <H1>Client Directory</H1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your design clients, corporate account brief contracts, and multi-project relationships.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="sm:self-start bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
        >
          <Plus className="size-4" />
          Add Client Profile
        </Button>
      </div>

      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="Search client directory by name, email or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Loading Clients Directory
          </p>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] border-dashed text-center p-8 bg-background/30">
          <Users className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg">No clients found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClients.map((client) => {
            let firstName = "";
            if (typeof client.firstName === "string" && client.firstName.trim()) {
              firstName = client.firstName.trim();
            } else if (
              typeof (client as { fullName?: string }).fullName === "string" &&
              (client as { fullName?: string }).fullName!.trim()
            ) {
              firstName = (client as { fullName?: string }).fullName!.trim().split(" ")[0] || "";
            }

            let lastName = "";
            if (typeof client.lastName === "string" && client.lastName.trim()) {
              lastName = client.lastName.trim();
            } else if (
              typeof (client as { fullName?: string }).fullName === "string" &&
              (client as { fullName?: string }).fullName!.trim()
            ) {
              lastName = (client as { fullName?: string }).fullName!.trim().split(" ").slice(1).join(" ") || "";
            }

            const initials = ((firstName[0] || "") + (lastName[0] || "")).toUpperCase() || "?";
            const clientProjects = projects.filter((p) => p.clientId === client.uid);

            return (
              <Link href={`/dashboard/clients/${client.uid}`} key={client.uid} className="block">
                <Card className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20 bg-card/60 backdrop-blur-xs h-full">
                  <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-primary/30 via-primary/10 to-transparent" />

                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/5 border border-primary/15 text-primary font-bold text-lg">
                      {initials.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="font-heading text-lg font-semibold truncate group-hover:text-primary transition-colors">
                        {firstName} {lastName}
                      </CardTitle>
                      {client.company ? (
                        <p className="text-xs text-muted-foreground font-medium truncate flex items-center gap-1 mt-0.5">
                          <Briefcase className="size-3 text-muted-foreground/60" />
                          {client.company}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 italic mt-0.5">Private Residence</p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3 text-sm">
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-muted/50">
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2.5 mt-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <FolderKanban className="size-3.5 text-primary/70" />
                        Active Projects:
                      </span>
                      <span className="font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
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
  );
}
