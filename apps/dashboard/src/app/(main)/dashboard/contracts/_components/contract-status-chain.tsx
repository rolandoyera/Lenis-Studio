import { type ComponentProps, Fragment, type ReactNode } from "react";

import { ArrowRight, CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Contract,
  ContractDisplayStage,
  ContractStatus,
} from "@/lib/types";

type StatusBadge = {
  label: string;
  variant: ComponentProps<typeof Badge>["variant"];
};

/** Map a legacy contract (no `contractDisplay`) onto a display stage + delivery. */
const FALLBACK_DISPLAY: Record<
  ContractStatus,
  { stage: ContractDisplayStage; delivered: boolean }
> = {
  draft: { stage: "draft", delivered: false },
  sent: { stage: "sent", delivered: false },
  viewed: { stage: "viewed", delivered: true },
  fully_executed: { stage: "executed", delivered: true },
  expired: { stage: "expired", delivered: false },
  voided: { stage: "void", delivered: false },
};

/**
 * Resolve a contract's realtime Status into its badge chain from the denormalized
 * `contractDisplay` (kept in sync server-side with the audit trail); falls back to
 * deriving the stage from `status` for legacy contracts. Executed/expired/void are
 * terminal — they collapse to a single badge since the intermediate steps are no
 * longer relevant. `deliveryFailed` is surfaced separately so the chain can render
 * an alert icon (with a cause tooltip) instead of a flat badge.
 */
export function resolveContractStatus(contract: Contract): {
  badges: StatusBadge[];
  deliveryFailed: boolean;
} {
  const { stage, delivered } = contract.contractDisplay
    ? {
        stage: contract.contractDisplay.stage,
        delivered: contract.contractDisplay.delivered,
      }
    : FALLBACK_DISPLAY[contract.status];

  // Render-time expiry backstop: a lapsed signing link reads as Expired even
  // before the lazy server sweep flips `status`. Never overrides a finished or
  // delivery-failed contract.
  const lapsed =
    !!contract.signingLinkExpiresAt &&
    Date.now() > contract.signingLinkExpiresAt;
  if (
    lapsed &&
    stage !== "executed" &&
    stage !== "void" &&
    stage !== "delivery_failed"
  ) {
    return {
      badges: [{ label: "Expired", variant: "destructive" }],
      deliveryFailed: false,
    };
  }

  const sent: StatusBadge = { label: "Sent", variant: "info" };
  const deliveredBadge: StatusBadge = {
    label: "Delivered",
    variant: "success",
  };

  switch (stage) {
    case "draft":
      return {
        badges: [{ label: "Draft", variant: "ghost" }],
        deliveryFailed: false,
      };
    case "sent":
      return { badges: [sent], deliveryFailed: false };
    case "delivered":
      return { badges: [sent, deliveredBadge], deliveryFailed: false };
    case "viewed":
      return {
        badges: [
          sent,
          ...(delivered ? [deliveredBadge] : []),
          { label: "Viewed", variant: "warning" },
        ],
        deliveryFailed: false,
      };
    case "executed":
      return {
        badges: [{ label: "Executed", variant: "success" }],
        deliveryFailed: false,
      };
    case "delivery_failed":
      // The "Delivery Failed" badge is replaced by the alert icon below; the
      // preceding "Sent" badge stays so the chain still reads Sent → (failed).
      return { badges: [sent], deliveryFailed: true };
    case "expired":
      return {
        badges: [{ label: "Expired", variant: "destructive" }],
        deliveryFailed: false,
      };
    case "void":
      return {
        badges: [{ label: "Void", variant: "destructive" }],
        deliveryFailed: false,
      };
  }
}

/**
 * Pinging destructive alert shown in place of a "Delivery Failed" badge. The
 * tooltip explains the likely cause so the user knows what to fix before a resend
 * (the email bounced or was blocked — see the Brevo delivery webhook).
 */
function DeliveryFailedAlert() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="flex w-fit items-center gap-1.5 text-destructive text-sm">
            <span className="relative flex size-4 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
              <CircleAlert className="relative size-4" />
            </span>
          </p>
        </TooltipTrigger>
        <TooltipContent>
          Email delivery failed. Check the client's email for a typo or invalid
          address. Fix the address, then resend. If that doesn't work, you'll
          need a different email address.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * The realtime Status column rendered as a chain of badges. Shared by the
 * contracts list and the project Files tab so both emit the identical live
 * status (delivery/view/sign) from `contractDisplay`. A delivery failure renders
 * a destructive alert icon with a cause tooltip instead of a flat badge.
 */
export function ContractStatusChain({ contract }: { contract: Contract }) {
  const { badges, deliveryFailed } = resolveContractStatus(contract);

  const items: { key: string; node: ReactNode }[] = badges.map((badge) => ({
    key: badge.label,
    node: (
      <Badge variant={badge.variant} className="px-0">
        {badge.label}
      </Badge>
    ),
  }));
  if (deliveryFailed) {
    items.push({ key: "delivery-failed", node: <DeliveryFailedAlert /> });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {i > 0 && (
            <ArrowRight
              className="size-3 shrink-0 self-center text-muted-foreground/50"
              aria-hidden
            />
          )}
          {item.node}
        </Fragment>
      ))}
    </div>
  );
}
