import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Wraps content in the same enter animation used on the Projects "Selections" tab:
 * a soft fade-in that rises slightly into place on mount. Handy for tab panels that
 * mount on demand.
 */
export function FadeIn({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("fade-in slide-in-from-bottom-2 animate-in duration-300", className)} {...props} />;
}
