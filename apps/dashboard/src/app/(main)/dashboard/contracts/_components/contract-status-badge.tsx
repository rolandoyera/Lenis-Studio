import { Badge } from "@/components/ui/badge";

import type { ContractStatus } from "@/lib/types";

type BadgeVariant = "ghost" | "info" | "warning" | "success" | "destructive";

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Draft", variant: "ghost" },
  sent: { label: "Sent", variant: "info" },
  viewed: { label: "Viewed", variant: "warning" },
  fully_executed: { label: "Fully Executed", variant: "success" },
  expired: { label: "Expired", variant: "ghost" },
  voided: { label: "Voided", variant: "destructive" },
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
