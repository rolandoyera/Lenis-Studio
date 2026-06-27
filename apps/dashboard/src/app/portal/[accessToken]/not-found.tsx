// Branded 404 for invalid/mismatched portal tokens. Rendered by notFound() from
// the portal pages, it sits inside the [accessToken] layout so the portal header/
// footer shell stays consistent. No org branding resolves for a bad token (the
// layout falls back to the default app brand), so this never reveals which org a
// token would have belonged to — and the copy intentionally names no firm.

export default function PortalNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-8 py-12 text-center shadow-sm">
      <h1 className="font-heading font-semibold text-neutral-900 text-xl">
        This link isn't valid
      </h1>
      <p className="text-neutral-500 text-sm leading-6">
        The link you followed isn't valid. Please check the link, or contact
        your designer for assistance.
      </p>
    </div>
  );
}
