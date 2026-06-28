// Server-only Brevo (transactional email) integration for contract delivery.
//
// Two halves:
//   - sendContractEmail: sends the signing link, tagging the message with contract
//     metadata so the delivery webhook can match events back to the contract.
//   - normalizeBrevoWebhookEvent: maps a raw Brevo webhook payload to one of our
//     precise email audit event types.
//
// Brevo is OPTIONAL: when BREVO_API_KEY is unset, sending no-ops gracefully (logs
// and reports "not configured") so the rest of the signing flow still works. The
// API key is read only here, server-side — never exposed to the client.

const BREVO_API_BASE = "https://api.brevo.com/v3";

/** Metadata round-tripped through Brevo so webhook events map back to a contract. */
export interface ContractEmailMetadata {
  contractId: string;
  contractVersionId: string;
  accessTokenId: string;
  organizationId: string;
  recipientEmail: string;
}

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

/** A file attached to a transactional email (Brevo expects base64 `content`). */
export interface BrevoAttachment {
  /** Base64-encoded file bytes. */
  content: string;
  /** File name shown to the recipient. */
  name: string;
}

export interface SendContractEmailInput {
  to: { email: string; name?: string };
  sender: { email: string; name: string };
  subject: string;
  htmlContent: string;
  /**
   * Contract metadata for the delivery webhook to match events back to the
   * contract's audit trail. Omit for emails that should NOT enter that chain
   * (e.g. the post-sign confirmation), so the signing-delivery certificate stays
   * precise about the one signing-link email.
   */
  metadata?: ContractEmailMetadata;
  attachments?: BrevoAttachment[];
}

export type SendContractEmailResult =
  | { ok: true; messageId?: string }
  | { ok: false; reason: "not_configured" | "send_failed"; error?: string };

/**
 * Send the signing-link email through Brevo. The contract metadata is attached as
 * an `X-Mailin-custom` header, which Brevo echoes back on every webhook event for
 * the message — that's how delivery events are matched to the contract.
 */
export async function sendContractEmail(
  input: SendContractEmailInput,
): Promise<SendContractEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(
      `[brevo] BREVO_API_KEY not set — skipping email to ${input.to.email}${
        input.metadata ? ` for contract ${input.metadata.contractId}` : ""
      }.`,
    );
    return { ok: false, reason: "not_configured" };
  }

  try {
    const res = await fetch(`${BREVO_API_BASE}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: input.sender,
        to: [input.to],
        subject: input.subject,
        htmlContent: input.htmlContent,
        // Only tag + attach audit metadata for emails that should feed the
        // delivery webhook (the signing link). Confirmation emails omit it.
        ...(input.metadata
          ? {
              tags: [`contract:${input.metadata.contractId}`],
              headers: { "X-Mailin-custom": JSON.stringify(input.metadata) },
            }
          : {}),
        ...(input.attachments?.length ? { attachment: input.attachments } : {}),
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`[brevo] send failed (${res.status}): ${error}`);
      return { ok: false, reason: "send_failed", error };
    }

    const data = (await res.json()) as { messageId?: string };
    return { ok: true, messageId: data.messageId };
  } catch (error) {
    console.error("[brevo] send threw:", error);
    return {
      ok: false,
      reason: "send_failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Our normalized email audit types — never "received"/"read" (Brevo proves neither). */
export type BrevoAuditEventType =
  | "email_sent"
  | "email_delivered"
  | "email_bounced"
  | "email_blocked";

export interface NormalizedBrevoEvent {
  type: BrevoAuditEventType;
  recipientEmail: string;
  providerMessageId?: string;
  brevoEventId?: string;
  metadata?: Partial<ContractEmailMetadata>;
}

/** Map a raw Brevo `event` name to one of our precise email audit types (or null). */
function mapBrevoEvent(event: string): BrevoAuditEventType | null {
  switch (event) {
    case "request":
    case "sent":
      return "email_sent";
    case "delivered":
      return "email_delivered";
    case "hard_bounce":
    case "soft_bounce":
    case "bounce":
      return "email_bounced";
    case "blocked":
    case "invalid_email":
    case "spam":
    case "error":
      return "email_blocked";
    default:
      // opens/clicks/deferred/unsubscribed etc. are not part of the delivery
      // evidence chain — and Brevo can't prove the client read anything.
      return null;
  }
}

type RawBrevoPayload = Record<string, unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Normalize a raw Brevo webhook payload. Returns null for events we don't record.
 * Pulls our metadata back out of the `X-Mailin-custom` header when present.
 */
export function normalizeBrevoWebhookEvent(
  payload: RawBrevoPayload,
): NormalizedBrevoEvent | null {
  const event = asString(payload.event);
  if (!event) return null;
  const type = mapBrevoEvent(event);
  if (!type) return null;

  let metadata: Partial<ContractEmailMetadata> | undefined;
  const custom = payload["X-Mailin-custom"] ?? payload.tags;
  if (typeof custom === "string") {
    try {
      metadata = JSON.parse(custom) as Partial<ContractEmailMetadata>;
    } catch {
      metadata = undefined;
    }
  }

  return {
    type,
    recipientEmail: asString(payload.email) ?? metadata?.recipientEmail ?? "",
    providerMessageId:
      asString(payload["message-id"]) ?? asString(payload.messageId),
    brevoEventId: asString(payload.id) ?? asString(payload["event-id"]),
    metadata,
  };
}
