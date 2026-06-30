// A centered white "paper" surface for portal documents (proposals, etc.).
// Presentational/hook-free so it works in both server and client trees.

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Paper({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto w-full rounded bg-card text-foreground shadow-sm",
        className,
      )}>
      {children}
    </section>
  );
}
