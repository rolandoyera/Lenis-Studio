"use client";

import { use, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import {
  ArrowRightLeft,
  ExternalLink,
  Loader2,
  Pencil,
  UserPlus,
  House,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import HeaderBackLink from "@/app/(main)/dashboard/_components/HeaderBackLink";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H1 } from "@/components/ui/typography";
import {
  convertLeadToClient,
  getLead,
  getOrganizationUsers,
  updateLead,
} from "@/lib/db";
import type { ActivityActor, Lead, UserProfile } from "@/lib/types";
import { formatPhone, normalizePhone } from "@/lib/utils";

import {
  BUDGET_RANGE_LABELS,
  DESIRED_TIMELINE_LABELS,
  getLeadName,
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_VARIANT,
  type LeadFormData,
  leadFormToFields,
  leadToForm,
  PROPERTY_TYPE_LABELS,
} from "../_components/lead-constants";
import { LeadFormDialog } from "../_components/lead-form-dialog";
import { DataField } from "@/components/ui/data-field";

interface PageProps {
  params: Promise<{ leadId: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const { leadId } = use(params);
  const router = useRouter();
  const { uid, profile, organizationId, loading: authLoading } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dependency; profile object identity churns on each heartbeat

    async function loadData() {
      try {
        const [leadData, usersData] = await Promise.all([
          getLead(leadId),
          getOrganizationUsers(orgId),
        ]);
        if (!leadData || leadData.organizationId !== orgId) {
          toast.error("Lead not found.");
          router.push("/dashboard/leads");
          return;
        }
        setLead(leadData);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to load lead details:", error);
        toast.error("Failed to retrieve lead from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [leadId, router, organizationId, authLoading]);

  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u.uid, u.fullName])),
    [users],
  );

  // Live user reference (assignedTo, convertedBy): resolve a uid to a name; the
  // current user reads as "You".
  const resolveUser = (userId?: string) => {
    if (!userId) return "—";
    if (userId === uid) return "You";
    return userMap[userId] ?? "Unknown user";
  };

  // Frozen actor snapshot (createdBy, updatedBy): the name travels with the
  // record, so non-user origins (e.g. the website) display their own identity
  // without any lookup. The current user still reads as "You".
  const resolveActor = (actor?: ActivityActor) => {
    if (!actor) return "—";
    if (actor.type === "user" && actor.id === uid) return "You";
    return actor.name;
  };

  // A freshly created lead has updatedAt === createdAt; only treat it as
  // "updated" once a real edit bumps updatedAt past creation.

  const handleEditSubmit = async (data: LeadFormData) => {
    if (!lead || !uid || !currentActor) return;
    setUpdating(true);
    try {
      const fields = leadFormToFields(data);
      // Re-stamp assignedAt when the assignee changes: a real user → now; cleared → 0.
      const prev = lead.assignedTo ?? "";
      const next = fields.assignedTo ?? "";
      const assignmentPatch =
        next !== prev ? { assignedAt: next ? Date.now() : 0 } : {};
      const written = await updateLead(lead.uid, {
        ...fields,
        ...assignmentPatch,
        updatedBy: currentActor,
      });
      setLead({ ...lead, ...written });
      setIsEditOpen(false);
      toast.success("Lead updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update lead.");
    } finally {
      setUpdating(false);
    }
  };

  const currentActor: ActivityActor | null = profile
    ? {
        type: "user",
        id: profile.uid,
        name: profile.fullName,
      }
    : null;

  const handleConvert = async () => {
    if (!lead || !uid || !currentActor) return;
    setConverting(true);
    try {
      const client = await convertLeadToClient(lead, uid, currentActor);
      const now = Date.now();
      setLead({
        ...lead,
        stage: "won",
        convertedClientId: client.uid,
        convertedAt: now,
        convertedBy: uid,
        updatedBy: currentActor,
        updatedAt: now,
        lastActivityAt: now,
      });
      setIsConvertOpen(false);
      toast.success("Lead converted to client successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to convert lead.");
    } finally {
      setConverting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Fetching Lead
        </p>
      </div>
    );
  }

  if (!lead) return null;

  const isConverted = !!lead.convertedClientId;
  const hasAddress = Boolean(
    lead.street ?? lead.city ?? lead.state ?? lead.zip,
  );
  const hasCityStateZip = Boolean(lead.city ?? lead.state ?? lead.zip);
  const fullAddress = [lead.street, lead.city, lead.state, lead.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <HeaderBackLink href="/dashboard/leads" />

      <div className="flex flex-col justify-between gap-4 pb-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <H1>{getLeadName(lead)}</H1>
          <Badge variant={LEAD_STAGE_VARIANT[lead.stage]}>
            {LEAD_STAGE_LABELS[lead.stage]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2">
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            onClick={() => setIsConvertOpen(true)}
            disabled={isConverted}
            className="flex items-center gap-2">
            <ArrowRightLeft className="size-4" />
            {isConverted ? "Converted" : "Convert to Client"}
          </Button>
        </div>
      </div>

      {isConverted && lead.convertedClientId && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <CardContent className="flex items-center justify-between gap-4 py-4 text-sm">
            <span className="text-muted-foreground">
              This lead was converted on{" "}
              {lead.convertedAt
                ? format(new Date(lead.convertedAt), "PPP")
                : "—"}{" "}
              by {resolveUser(lead.convertedBy)}.
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/clients/${lead.convertedClientId}`}>
                View Client
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <CardContent className="flex items-center justify-between gap-4 py-4 text-sm">
            <span className="text-muted-foreground">
              This lead was converted on{" "}
              {lead.convertedAt
                ? format(new Date(lead.convertedAt), "PPP")
                : "—"}{" "}
              by {resolveUser(lead.convertedBy)}.
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/clients/${lead.convertedClientId}`}>
                View Client
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Card variant="panel" className="lg:col-span-4">
          <CardHeader>
            <CardTitle>
              <UserPlus className="icons" />
              Lead Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 min-h-60">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <DataField label="Name" empty="Not set">
                {`${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim()}
              </DataField>
              <DataField label="Company" empty="Not set">
                {lead.company}
              </DataField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <DataField label="Email" empty="Not set">
                {lead.email}
              </DataField>
              <DataField label="Phone" empty="Not set">
                {lead.phone ? (
                  <a
                    href={`tel:${normalizePhone(lead.phone)}`}
                    className="hover:text-primary">
                    {formatPhone(lead.phone)}
                  </a>
                ) : null}
              </DataField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <DataField label="Address" empty="Not set">
                {hasAddress && (
                  <div className="flex flex-col">
                    {lead.street && <span>{lead.street}</span>}
                    {hasCityStateZip && (
                      <span className="mt-0.5">
                        {[
                          lead.city,
                          [lead.state, lead.zip].filter(Boolean).join(" "),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                    {fullAddress && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 flex w-fit items-center gap-1 text-primary text-xs hover:underline">
                        google maps
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                )}
              </DataField>
            </div>
          </CardContent>
        </Card>

        <Card variant="panel" className="lg:col-span-4">
          <CardHeader>
            <CardTitle>
              <House className="icons" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 min-h-60">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <DataField label="Property Type" empty="Not set">
                {lead.propertyType
                  ? PROPERTY_TYPE_LABELS[lead.propertyType]
                  : null}
              </DataField>
              <DataField label="Budget Range" empty="Not set">
                {lead.budgetRange
                  ? BUDGET_RANGE_LABELS[lead.budgetRange]
                  : null}
              </DataField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <DataField label="Desired Timeline" empty="Not set">
                {lead.desiredTimeline
                  ? DESIRED_TIMELINE_LABELS[lead.desiredTimeline]
                  : null}
              </DataField>
              <DataField label="Assigned To">
                {resolveUser(lead.assignedTo)}
              </DataField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2"></div>
          </CardContent>
        </Card>
        <Card variant="panel" className="lg:col-span-4">
          <CardHeader>
            <CardTitle>
              <Megaphone className="icons" />
              Source Details
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 min-h-60">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <DataField label="Created At" empty="Not set">
                {format(new Date(lead.createdAt), "PPp")}
              </DataField>
              <DataField label="Created By" empty="Not set">
                {resolveActor(lead.createdBy)}
              </DataField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <DataField label="Source" empty="Not set">
                {lead.source ? LEAD_SOURCE_LABELS[lead.source] : null}
              </DataField>
              <DataField label="Source Detail" empty="Not set">
                {lead.sourceDetail}
              </DataField>
            </div>
            <DataField label="Source Detail" empty="Not set">
              {lead.sourceDetail}
            </DataField>
          </CardContent>
        </Card>

        {lead.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-muted-foreground text-sm">
              {lead.notes}
            </CardContent>
          </Card>
        )}
      </div>

      <LeadFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Edit Lead"
        description="Update lead contact, project fit, and pipeline details."
        submitLabel="Save Changes"
        submitting={updating}
        users={users}
        defaultValues={leadToForm(lead)}
        onSubmit={handleEditSubmit}
      />

      <AlertDialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Convert to Client?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This creates a new client from{" "}
              <span className="font-medium text-foreground">
                {getLeadName(lead)}
              </span>{" "}
              and marks this lead as won. The lead is kept for your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={converting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConvert();
              }}
              disabled={converting}
              className="flex items-center gap-1.5">
              {converting && <Loader2 className="size-4 animate-spin" />}
              Convert to Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
