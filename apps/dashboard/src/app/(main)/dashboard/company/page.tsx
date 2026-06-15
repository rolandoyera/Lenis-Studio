import { getMetaConnection, getMetaPendingPages } from "@/server/meta-actions";

import { CompanyMetaCard } from "./company-meta-card";

export default async function Page({ searchParams }: { searchParams: Promise<{ meta?: string }> }) {
  const { meta } = await searchParams;

  const connection = await getMetaConnection();
  // Only hit the Graph API for the picker when we actually arrived from a
  // multi-page grant (?meta=select) — keeps normal page loads cheap.
  const pendingPages = meta === "select" ? await getMetaPendingPages() : [];

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <CompanyMetaCard connection={connection} pendingPages={pendingPages} justConnected={meta === "connected"} />
    </div>
  );
}
