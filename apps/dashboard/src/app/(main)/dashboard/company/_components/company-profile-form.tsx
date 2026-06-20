"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { deleteReplacedStorageFiles, getOrganization, updateOrganization } from "@/lib/db";
import type { Organization } from "@/lib/types";

import { BrandingCard, BrandingFields } from "./branding-section";
import { formToOrganizationUpdate } from "./company-constants";
import { CompanyInfoCard, CompanyInfoFields } from "./company-info-section";
import { SectionEditDialog } from "./section-dialog";
import { SettingsCard, SettingsFields } from "./settings-section";

type EditSection = "company" | "branding" | "settings" | null;

export function CompanyProfileForm() {
  const { organizationId, loading: authLoading } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditSection>(null);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const id = organizationId;
    async function load() {
      try {
        const data = await getOrganization(id);
        if (data) setOrg(data);
      } catch {
        toast.error("Failed to load company profile.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [organizationId, authLoading]);

  const persist = async (
    patch: Partial<Organization>,
    prevPaths: Array<string | undefined> = [],
    nextPaths: Array<string | undefined> = [],
  ): Promise<boolean> => {
    if (!organizationId || !org) return false;
    const previous = org;
    setOrg({ ...org, ...patch }); // optimistic
    try {
      await updateOrganization(organizationId, patch);
      if (prevPaths.length > 0) await deleteReplacedStorageFiles(prevPaths, nextPaths);
      toast.success("Company profile saved.");
      return true;
    } catch (error) {
      console.error("Company profile save error:", error);
      setOrg(previous); // revert
      toast.error("Failed to save company profile.");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!org) {
    return <p className="text-muted-foreground text-sm">No organization found.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CompanyInfoCard org={org} onEdit={() => setEditing("company")} />
        <SettingsCard org={org} onEdit={() => setEditing("settings")} />
        <BrandingCard org={org} onEdit={() => setEditing("branding")} />
      </div>

      {/* Company Information (company + address → companyProfile block) */}
      <SectionEditDialog
        open={editing === "company"}
        onOpenChange={(v) => setEditing(v ? "company" : null)}
        title="Edit Company Information"
        description="Company details and address. A formatted address is generated automatically."
        org={org}
        persist={persist}
        buildPatch={(data) => ({
          patch: {
            companyProfile: formToOrganizationUpdate(data).companyProfile,
          },
        })}
      >
        {(props) => <CompanyInfoFields {...props} />}
      </SectionEditDialog>

      {/* Branding (light/dark logos, icon marks, and brand colors) */}
      <SectionEditDialog
        open={editing === "branding"}
        onOpenChange={(v) => setEditing(v ? "branding" : null)}
        title="Edit Branding"
        description="Logos and brand colors used throughout the app and exports."
        org={org}
        persist={persist}
        buildPatch={(data) => {
          const { branding } = formToOrganizationUpdate(data);
          return {
            patch: { branding },
            prevPaths: [
              org.branding?.logoLightPath,
              org.branding?.logoDarkPath,
              org.branding?.iconLightPath,
              org.branding?.iconDarkPath,
            ],
            nextPaths: [branding.logoLightPath, branding.logoDarkPath, branding.iconLightPath, branding.iconDarkPath],
          };
        }}
      >
        {(props) => <BrandingFields {...props} organizationId={organizationId ?? ""} />}
      </SectionEditDialog>

      {/* Settings */}
      <SectionEditDialog
        open={editing === "settings"}
        onOpenChange={(v) => setEditing(v ? "settings" : null)}
        title="Edit Settings"
        description="Defaults applied to proposals, pricing, and localization."
        org={org}
        persist={persist}
        buildPatch={(data) => ({
          patch: { settings: formToOrganizationUpdate(data).settings },
        })}
      >
        {(props) => <SettingsFields {...props} />}
      </SectionEditDialog>
    </>
  );
}
