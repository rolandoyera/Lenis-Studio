"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { refreshInstagramSnapshot } from "@/server/meta-actions";

/** TEMP: manually trigger today's snapshot (same logic as the daily cron). */
export function InstagramRefreshButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await refreshInstagramSnapshot();
      if (result.success) {
        toast.success("Snapshot refreshed.");
      } else {
        toast.error(result.error ?? "Failed to refresh.");
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      <RefreshCw className={isPending ? "size-4 animate-spin" : "size-4"} />
      {isPending ? "Refreshing…" : "Refresh now"}
    </Button>
  );
}
