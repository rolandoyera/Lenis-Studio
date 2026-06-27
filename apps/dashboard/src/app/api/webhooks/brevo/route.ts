// Brevo transactional-email webhook. Maps delivery events back to the originating
// contract using the metadata we attached when sending (echoed in the
// `X-Mailin-custom` header), then appends a precise, normalized email audit event
// to the contract's trail. The raw payload is stored privately in Storage (path
// only is referenced) so the main contract doc stays clean and no raw provider
// data is ever exposed to the client.
//
// Labels stay precise: delivered/bounced/blocked/sent — Brevo proves the email
// reached an address, NOT that the client received or read it.

import type { NextRequest } from "next/server";

import { normalizeBrevoWebhookEvent } from "@/server/brevo";
import {
  storeRawBrevoPayload,
  writeContractAuditEvent,
} from "@/server/contract-audit";

export const dynamic = "force-dynamic";

type RawPayload = Record<string, unknown>;

async function handleEvent(payload: RawPayload): Promise<void> {
  const normalized = normalizeBrevoWebhookEvent(payload);
  if (!normalized) return; // not part of the delivery evidence chain

  const { metadata } = normalized;
  const contractId = metadata?.contractId;
  const organizationId = metadata?.organizationId;
  if (!contractId || !organizationId) {
    // Without our metadata we can't safely attribute the event to a contract.
    console.warn("[brevo webhook] event missing contract metadata; skipping.");
    return;
  }

  const rawProviderPayloadPath = await storeRawBrevoPayload({
    organizationId,
    contractId,
    eventType: normalized.type,
    eventId: normalized.brevoEventId ?? String(Date.now()),
    payload,
  });

  // Deterministic id keeps retried webhook deliveries idempotent.
  const docId = normalized.brevoEventId
    ? `brevo-${normalized.type}-${normalized.brevoEventId}`
    : undefined;

  await writeContractAuditEvent(
    contractId,
    {
      type: normalized.type,
      occurredAt: Date.now(),
      actorType: "system",
      provider: "brevo",
      recipientEmail: normalized.recipientEmail,
      providerMessageId: normalized.providerMessageId,
      brevoEventId: normalized.brevoEventId,
      rawProviderPayloadPath,
    },
    docId,
  );
}

// TEMP DIAGNOSTIC: log the method + headers Brevo actually sends, so we can see
// which header carries the auth token (values truncated so the secret isn't fully
// printed). Remove once the webhook is confirmed working.
function logBrevoRequest(req: NextRequest, tag: string): void {
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] =
      value.length > 16 ? `${value.slice(0, 12)}…(len ${value.length})` : value;
  });
  console.log(`[brevo webhook ${tag}] ${req.method} ${req.nextUrl.pathname}`, {
    headers,
    hasSecret: Boolean(process.env.BREVO_WEBHOOK_SECRET),
  });
}

// TEMP: respond 200 to GET/HEAD so a save-time verification ping doesn't 405.
export async function GET(req: NextRequest) {
  logBrevoRequest(req, "GET");
  return new Response("ok", { status: 200 });
}

export async function POST(req: NextRequest) {
  logBrevoRequest(req, "POST"); // TEMP DIAGNOSTIC — remove when confirmed.

  // Optional shared-secret guard. When BREVO_WEBHOOK_SECRET is set, require it via
  // Brevo's "Token" auth — the token is sent in the `Authorization` header (with or
  // without a `Bearer ` prefix). Set BREVO_WEBHOOK_SECRET to that exact token value.
  const expected = process.env.BREVO_WEBHOOK_SECRET;
  if (expected) {
    const provided = req.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();
    if (provided !== expected) {
      console.warn("[brevo webhook] 403 — auth token did not match.");
      return new Response("Forbidden", { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Brevo may POST a single event object or a batch array.
  const events = Array.isArray(body) ? body : [body];
  try {
    await Promise.all(
      events
        .filter((e): e is RawPayload => typeof e === "object" && e !== null)
        .map(handleEvent),
    );
  } catch (error) {
    console.error("[brevo webhook] processing failed:", error);
    // 200 anyway so Brevo doesn't hammer retries on a transient write error;
    // the raw payload (if stored) preserves the event for reconciliation.
  }

  return new Response("ok", { status: 200 });
}
