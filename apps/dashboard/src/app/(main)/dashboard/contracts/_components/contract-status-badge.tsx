import { Badge } from "@/components/ui/badge";

import type { ContractStatus } from "@/lib/types";

type BadgeVariant =
  | "secondary"
  | "info"
  | "warning"
  | "success"
  | "destructive";

const STATUS_CONFIG: Record<
  ContractStatus,
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "info" },
  viewed: { label: "Viewed", variant: "warning" },
  signed: { label: "Signed", variant: "success" },
  void: { label: "Void", variant: "destructive" },
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
