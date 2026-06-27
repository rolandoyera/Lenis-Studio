// Token-gated download of the final signed PDF. Re-validates the access token and
// contract identity server-side (same gate as the portal view), then streams the
// private Storage object — the PDF is never served from a public URL. Only a
// fully-executed contract has a downloadable document.

import type { NextRequest } from "next/server";

import { generateAndStoreFinalContractPdf } from "@/server/contract-pdf";
import { getAdminBucket, getAdminDb } from "@/server/firebase-admin";
import { resolvePortalContract } from "@/server/portal";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ accessToken: string; contractId: string }> },
) {
  const { accessToken, contractId } = await params;
  const result = await resolvePortalContract(accessToken, contractId);
  if (!result.ok) {
    return new Response("Not found", { status: 404 });
  }

  const { contract } = result;
  if (contract.status !== "fully_executed") {
    return new Response("Contract is not yet signed", { status: 409 });
  }

  // Generate on demand if the PDF wasn't produced at signing time (best-effort
  // generation can fail), then persist the path for next time.
  let path = contract.finalPdfPath;
  if (!path) {
    try {
      path = await generateAndStoreFinalContractPdf({ contract });
      await getAdminDb()
        .collection("contracts")
        .doc(contractId)
        .update({ finalPdfPath: path, finalPdfGeneratedAt: Date.now() });
    } catch (error) {
      console.error(
        `[contract-download] On-demand PDF generation failed for contract ${contractId}:`,
        error,
      );
      return new Response(
        `PDF generation failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
        { status: 500 },
      );
    }
  }

  try {
    const [buffer] = await getAdminBucket().file(path).download();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="contract-${contractId}.pdf"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(
      `[contract-download] Failed to stream signed PDF for contract ${contractId} (path=${path}):`,
      error,
    );
    return new Response(
      `Storage read failed (path=${path}): ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 },
    );
  }
}
