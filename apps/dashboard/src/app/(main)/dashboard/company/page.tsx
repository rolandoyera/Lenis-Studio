import { PageTitle } from "@/components/page-title-updater";
import { H1 } from "@/components/ui/typography";

import { CompanyProfileForm } from "./_components/company-profile-form";

export default function Page() {
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
      </div>
    </>
  );
}
