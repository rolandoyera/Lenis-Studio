"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Fires the real app toasts so their styling (from the shared `<Toaster />`)
 * can be reviewed live, rather than mocked.
 */
export function ToastGallery() {
  return (
    <div className="flex flex-wrap gap-2 py-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.success("Changes saved.")}
      >
        Success
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.error("Something went wrong.")}
      >
        Error
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.warning("This action can't be undone.")}
      >
        Warning
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.info("Heads up — syncing in the background.")}
      >
        Info
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.loading("Working on it…")}
      >
        Loading
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          toast.error("Couldn't load analytics", {
            description: "The request timed out. Try again in a moment.",
          })
        }
      >
        With description
      </Button>
    </div>
  );
}
