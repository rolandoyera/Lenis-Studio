import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { AnalyticsErrorToast } from "./analytics-error-toast";

function isConfigMissing(error?: string) {
  if (!error) return true;
  const lower = error.toLowerCase();
  return lower.includes("not configured") || lower.includes("config missing");
}

interface AnalyticsSetupRequiredProps {
  error?: string;
  title?: string;
  className?: string;
}

/**
 * Uniform failure state for analytics widgets: a centered warning badge.
 * Real API errors (anything beyond missing configuration) also surface
 * their detail via the shared error toast.
 */
export function AnalyticsSetupRequired({
  error,
  title,
  className,
}: AnalyticsSetupRequiredProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-1 items-center justify-center",
        className,
      )}
    >
      {!isConfigMissing(error) && (
        <AnalyticsErrorToast error={error} title={title} />
      )}
      <Badge variant="warning">Setup required</Badge>
    </div>
  );
}
