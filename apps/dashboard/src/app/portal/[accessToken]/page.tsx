// Portal landing. Validates the access token, then sends the client to their
// contract. Identity/existence failures 404; expired or revoked links show a
// branded message. No internal contract data is read or rendered here.

import Link from "next/link";
import { notFound } from "next/navigation";

import { FileText } from "lucide-react";

import { resolvePortalAccess } from "@/server/portal";

import { PortalMessage } from "../_components/portal-message";

export default async function PortalLandingPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken } = await params;
  const result = await resolvePortalAccess(accessToken);

  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    return <PortalMessage reason={result.reason} orgName={result.orgName} />;
  }

  const { access } = result;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-900/5 text-neutral-700">
        <FileText className="size-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading font-semibold text-neutral-900 text-xl">
          Your contract is ready to review
        </h1>
        <p className="text-neutral-500 text-sm leading-6">
          Your interior design agreement is ready. Review the full document
          before signing.
        </p>
      </div>
      <Link
        href={`/portal/${accessToken}/contract/${access.contractId}`}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-6 font-medium text-sm text-white transition-colors hover:bg-neutral-800">
        Review your contract
      </Link>
    </div>
  );
}
