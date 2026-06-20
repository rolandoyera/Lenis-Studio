import { PageTitle } from "@/components/page-title-updater";
import { H1 } from "@/components/ui/typography";
import { getMetaConnection, getMetaPendingPages } from "@/server/meta-actions";

import { CompanyProfileForm } from "./_components/company-profile-form";
import { CompanyMetaCard } from "./company-meta-card";

export default async function Page({ searchParams }: { searchParams: Promise<{ meta?: string }> }) {
  const { meta } = await searchParams;

  const connection = await getMetaConnection();
  // Only hit the Graph API for the picker when we actually arrived from a
  // multi-page grant (?meta=select) — keeps normal page loads cheap.
  const pendingPages = meta === "select" ? await getMetaPendingPages() : [];

  return (
    <>
      <PageTitle title="Company Profile" />
      <div className="mx-auto flex w-full flex-col gap-6 p-6">
        <div>
          <H1>Company Profile</H1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your organization details, branding, and defaults used across the app.
          </p>
        </div>

        <CompanyProfileForm />

        <CompanyMetaCard connection={connection} pendingPages={pendingPages} justConnected={meta === "connected"} />
      </div>
    </>
  );
}
