// Contract view for the client portal. Access is validated entirely server-side:
// the token is hashed and matched to portalAccess, then status, expiry,
// contractId, and org/client/project identity are all checked before any contract
// data is rendered. The document renders from the frozen lockedSnapshot (never the
// live editable fields). Opening stamps viewedAt + a portal_opened audit event.
// A still-open contract shows the typed-signature form; a fully-executed one shows
// the signed state with a download link.

import { notFound } from "next/navigation";

import { recordPortalOpen } from "@/server/contract-signing";
import { resolvePortalContract } from "@/server/portal";

import { PortalContractDocument } from "../../../_components/portal-contract-document";
import { PortalMessage } from "../../../_components/portal-message";
import { PortalSignedState } from "../../../_components/portal-signed-state";
import { PortalSignForm } from "../../../_components/portal-sign-form";

// Token-gated, per-request data — never cache or statically render.
export const dynamic = "force-dynamic";

export default async function PortalContractPage({
  params,
}: {
  params: Promise<{ accessToken: string; contractId: string }>;
}) {
  const { accessToken, contractId } = await params;
  const result = await resolvePortalContract(accessToken, contractId);

  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    return <PortalMessage reason={result.reason} />;
  }

  const { access, contract, firmLogoUrl } = result;

  // lockedSnapshot is guaranteed present by resolvePortalContract.
  const snapshot = contract.lockedSnapshot;
  if (!snapshot) notFound();

  // Record the open (portalAccess.viewedAt + sent→viewed + portal_opened audit,
  // deduped within 30 minutes). Best-effort — never blocks rendering.
  await recordPortalOpen(access, contract);

  const isExecuted = contract.status === "fully_executed";

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="font-heading font-semibold text-neutral-900 text-xl">
          {contract.title}
        </h1>
        <p className="mt-1 text-neutral-500 text-sm">
          {isExecuted
            ? "This contract has been signed and is fully executed."
            : "Please review the full agreement below, then sign."}
        </p>
      </div>

      <PortalContractDocument snapshot={snapshot} firmLogoUrl={firmLogoUrl} />

      {isExecuted ? (
        <PortalSignedState
          accessToken={accessToken}
          contractId={contractId}
          signerName={contract.clientSignature?.signerName}
          signedAt={contract.clientSignature?.signedAt}
        />
      ) : (
        <PortalSignForm accessToken={accessToken} contractId={contractId} />
      )}
    </div>
  );
}
