// Branded, centered fallback shown when a portal link can't open a contract
// (expired / no longer available). Token/identity mismatches use notFound()
// instead so the portal never confirms which contracts exist.

import type { PortalFailureReason } from "@/server/portal";

const COPY: Record<
  Exclude<PortalFailureReason, "not_found">,
  { title: string; body: string }
> = {
  expired: {
    title: "This link has expired",
    body: "The secure link to your contract is no longer valid. Please contact your designer to request a new one.",
  },
  unavailable: {
    title: "This contract isn't available",
    body: "This contract can no longer be viewed through this link. Please reach out to your designer for help.",
  },
};

export function PortalMessage({
  reason,
}: {
  reason: Exclude<PortalFailureReason, "not_found">;
}) {
  const { title, body } = COPY[reason];
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
      <h1 className="font-heading font-semibold text-neutral-900 text-xl">
        {title}
      </h1>
      <p className="text-neutral-500 text-sm leading-6">{body}</p>
    </div>
  );
}
