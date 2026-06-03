"use client";

import { Loader2, Plus, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProposalsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pt-6">
      {/* Header section with Premium typography */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading">Interactive Proposals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create room-by-room spreadsheets, override quantities, print luxury client catalog PDFs, and dispatch via
          Brevo.
        </p>
      </div>

      {/* Modern teaser card for Phase 2 spreadsheet matrix */}
      <Card className="relative overflow-hidden border bg-linear-to-br from-primary/10 via-background to-background p-6">
        {/* Decorative subtle visual accent */}
        <div className="absolute -top-12 -right-12 size-40 bg-primary/10 rounded-full blur-2xl" />

        <CardHeader className="p-0 pb-4 flex flex-row items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/20 text-primary">
            <ReceiptText className="size-5" />
          </div>
          <div>
            <CardTitle className="font-heading text-lg font-semibold flex items-center gap-1.5">
              Room-by-Room Spreadsheet Matrix
              <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary animate-pulse">
                Phase 2
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Sourcing presentation engine & dynamic client cost calculator.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            The upcoming **Interactive Proposal Matrix** will link your projects directly to items in the **Global
            Catalog Library**. You will be able to:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-foreground/80 list-disc list-inside pl-1.5">
            <li>Nesting & collapsible Room Headers</li>
            <li>Drag & drop reordering handles</li>
            <li>Inline "Calculate Costs" Popups</li>
            <li>Local fabric, size & price overrides</li>
            <li>Aggregate sums for cost/markups</li>
            <li>Sourcing images inline previews</li>
          </ul>

          <div className="flex items-center gap-3 border-t pt-5 mt-2">
            <Button disabled className="flex items-center gap-2">
              <Plus className="size-4" />
              Create Draft Proposal
            </Button>
            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
              <Loader2 className="size-3 animate-spin text-primary" />
              Awaiting Phase 2 implementation. Database and collection structures are ready!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
