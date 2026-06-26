// Read-only contract renderer for the client portal. Renders straight from the
// frozen `lockedSnapshot` (raw template `pages` + the `resolved` token→value map)
// so the document reads identically to what was sent, even if the code-based
// template changes later. Pure/server-safe — no client hooks. Internal-only
// fields (audit, status, ids) are never passed in, so none can leak.

import Image from "next/image";

import type { LockedContractSnapshot } from "@/lib/types";

import {
  boldText,
  SEGMENT_SPLIT_RE,
  tokenName,
} from "@/app/(main)/dashboard/contracts/_components/contract-template";

/** Inline render of one line: swap {{TOKEN}} markers and **bold** runs. */
function renderSegments(text: string, resolved: Record<string, string>) {
  return text.split(SEGMENT_SPLIT_RE).map((part, i) => {
    const bold = boldText(part);
    if (bold) {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
        <span key={i} className="font-semibold text-foreground">
          {bold}
        </span>
      );
    }
    const name = tokenName(part);
    if (!name) {
      // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
      return <span key={i}>{part}</span>;
    }
    // Sent contracts are complete; an empty optional token renders as nothing.
    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
      <span key={i} className="font-black text-foreground">
        {resolved[name] ?? ""}
      </span>
    );
  });
}

/** True for a line that is a single all-caps bold run — a centered heading. */
function isHeadingLine(line: string): boolean {
  const inner = boldText(line.trim());
  return inner !== null && inner === inner.toUpperCase() && /[A-Z]/.test(inner);
}

/** Render a page body line-by-line so all-caps bold headings can center. */
function DocumentBody({
  body,
  resolved,
}: {
  body: string;
  resolved: Record<string, string>;
}) {
  return (
    <div className="font-contract text-[15px] text-foreground/70 leading-7">
      {body.split("\n").map((line, i) => (
        <p
          // biome-ignore lint/suspicious/noArrayIndexKey: static template, stable order
          key={i}
          className={`whitespace-pre-wrap${isHeadingLine(line) ? " text-center" : ""}`}
        >
          {line ? renderSegments(line, resolved) : " "}
        </p>
      ))}
    </div>
  );
}

/**
 * Page number pinned to the bottom of each sheet. Hidden in print (the print path
 * streams the document continuously, so per-page footers don't map to A4 breaks).
 */
function PageFooter({ page, total }: { page: number; total: number }) {
  return (
    <div className="contract-page-meta mt-auto flex justify-center pt-6 print:hidden">
      <span className="font-contract text-foreground/45 text-xs">
        Page {page} of {total}
      </span>
    </div>
  );
}

/**
 * The full read-only contract document, rendered as A4-proportioned sheets. Each
 * sheet is at least A4 tall (and grows if its content is longer, so nothing is
 * ever clipped) with an initials footer pinned to its bottom. `contract-print-area`
 * re-declares the light "paper" theme for this subtree (matching the in-app
 * preview) and lets the browser print dialog isolate the document.
 */
export function PortalContractDocument({
  snapshot,
  firmLogoUrl,
}: {
  snapshot: LockedContractSnapshot;
  firmLogoUrl?: string;
}) {
  const total = snapshot.pages.length;
  return (
    <div className="contract-print-area flex flex-col items-center gap-6">
      {snapshot.pages.map((page) => (
        <div
          key={page.page}
          className="contract-sheet relative flex min-h-[297mm] w-full max-w-[210mm] flex-col rounded-sm bg-background p-8 shadow-sm sm:p-12"
        >
          {page.page === 1 && firmLogoUrl && (
            <Image
              src={firmLogoUrl}
              alt={snapshot.parties.companyLegalName || "Firm logo"}
              width={256}
              height={128}
              className="mx-auto mb-8 h-32 w-auto object-contain"
              unoptimized
              priority
            />
          )}
          <DocumentBody body={page.body} resolved={snapshot.resolved} />
          <PageFooter page={page.page} total={total} />
        </div>
      ))}
    </div>
  );
}
