"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Exports the current report via the browser print dialog (Save as PDF).
 * Temporary: we expect to move to a Playwright-rendered PDF of the same route
 * later, at which point this stays as the on-screen "quick export" affordance.
 */
export function PrintReportButton({ className }: { className?: string }) {
  return (
    <Button onClick={() => window.print()} className={className}>
      <Printer className="size-4" />
      Download PDF
    </Button>
  );
}
