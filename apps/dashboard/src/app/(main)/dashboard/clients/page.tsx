"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { PageTitle } from "@/components/page-title-updater";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { H3 } from "@/components/ui/typography";
import { addClient, getClients } from "@/lib/db";
import type { Client } from "@/lib/types";
import { formatPhone } from "@/lib/utils";

import type { ClientFormData } from "./_components/client-constants";
import { ClientFormDialog } from "./_components/client-form-dialog";
import { getClientName } from "./_components/client-name";
import PageHeader from "@/components/page-header";
import { DataField } from "@/components/ui/data-field";

export default function ClientsPage() {
  const { profile, organizationId, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dependency; profile object identity churns on each heartbeat

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
        const clientsData = await getClients(orgId);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load clients:", error);
        toast.error("Failed to fetch CRM contacts from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [organizationId, authLoading]);

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
      toast.success("New client created successfully!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save client.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    if (!client) return false;
    const term = searchQuery.toLowerCase();

    const { firstName, lastName } = getClientName(client);

    const email = typeof client.email === "string" ? client.email : "";
    const company = typeof client.company === "string" ? client.company : "";

    return (
      firstName.toLowerCase().includes(term) ||
      lastName.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term) ||
      company.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <PageTitle title="Client Directory" />
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Client Directory"
            description="Manage your clients."
          />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="size-4" />
            Client
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
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="mt-4 flex items-center gap-2">
                <Plus className="size-4" />
                Add Client profile
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {filteredClients.map((client) => {
              const { firstName, lastName } = getClientName(client);

              return (
                <Card
                  variant="panel"
                  key={client.uid}
                  className="group relative flex h-full flex-col overflow-hidden transition-all duration-200 has-[.detail-link:hover]:-translate-y-0.5 has-[.detail-link:hover]:border-primary/30 has-[.detail-link:hover]:shadow-md">
                  <CardHeader className="gap-2">
                    <Link
                      href={`/dashboard/clients/${client.uid}`}
                      className="detail-link shrink-0 cursor-pointer">
                      <Avatar className="size-8">
                        {client.company ? (
                          <Building2 className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </Avatar>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <H3 className="truncate transition-colors group-has-[.detail-link:hover]:text-primary">
                        <Link
                          href={`/dashboard/clients/${client.uid}`}
                          className="detail-link cursor-pointer">
                          {client.company
                            ? client.company
                            : `${firstName} ${lastName}`}
                        </Link>
                      </H3>
                    </div>
                  </CardHeader>

                  <CardContent className="py-2">
                    <div className="flex flex-col gap-2 rounded-lg border border-muted/50 bg-muted p-3">
                      <DataField
                        variant="icon"
                        label={<Mail />}
                        empty="Not set">
                        {client.email}
                      </DataField>
                      <DataField
                        variant="icon"
                        label={<Phone />}
                        empty="Not set">
                        {client.phone && formatPhone(client.phone)}
                      </DataField>
                      <DataField
                        variant="icon"
                        label={<MapPin />}
                        empty="Not set">
                        {[client.city, client.state].filter(Boolean).join(", ")}
                      </DataField>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="link"
                      size="sm"
                      asChild
                      className="ml-auto -mr-2 detail-link">
                      <Link
                        href={`/dashboard/clients/${client.uid}`}
                        prefetch={false}
                        className="group/btn flex items-center gap-0.5">
                        View Client
                        <ArrowRight className="size-3 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
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
