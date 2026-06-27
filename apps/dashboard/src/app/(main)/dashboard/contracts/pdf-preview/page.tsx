"use client";

// DEV-ONLY on-screen preview of the final contract PDF, for styling without
// re-sending/re-signing. Renders the exact production <ContractPdf> tree inside
// @react-pdf's <PDFViewer> (browser iframe), so edits to the shared styles in
// `@/lib/contract-pdf-document` hot-reload here live. Open with ?id=<contractId>;
// defaults to the contract currently being styled. Disabled in production.

import { Suspense, useEffect, useState } from "react";

import dynamic from "next/dynamic";
import { notFound, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

import type { CertData } from "@/lib/contract-pdf-document";
import { ContractPdf } from "@/lib/contract-pdf-document";
import type { Contract, ContractAuditEvent } from "@/lib/types";
import { loadContractPdfPreview } from "@/server/contract-pdf-preview";

// @react-pdf's DOM viewer can't be server-rendered.
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  { ssr: false },
);

const DEFAULT_CONTRACT_ID = "amxklDBsR3U5740gLUlY";

export default function ContractPdfPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
    >
      <PreviewInner />
    </Suspense>
  );
}

function PreviewInner() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("id") ?? DEFAULT_CONTRACT_ID;

  const [data, setData] = useState<{
    contract: Contract;
    cert: CertData;
    events: ContractAuditEvent[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    loadContractPdfPreview(contractId)
      .then((loaded) => {
        // Dev-only: inspect the raw audit trail (esp. email_* delivery events).
        console.log(`[pdf-preview] contract ${contractId} — cert:`, loaded.cert);
        console.log(
          `[pdf-preview] ${loaded.events.length} audit events:`,
          loaded.events,
        );
        console.table(
          loaded.events.map((e) => ({
            type: e.type,
            occurredAt: new Date(e.occurredAt).toLocaleString(),
            actorType: "actorType" in e ? e.actorType : undefined,
          })),
        );
        setData(loaded);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load contract."),
      );
  }, [contractId]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <PDFViewer style={{ width: "100%", height: "100vh", border: "none" }}>
      <ContractPdf contract={data.contract} cert={data.cert} />
    </PDFViewer>
  );
}
