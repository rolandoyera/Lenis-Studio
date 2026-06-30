import { describe, expect, it } from "vitest";

import { normalizeBrevoWebhookEvent } from "./brevo";

describe("normalizeBrevoWebhookEvent — event mapping", () => {
  // This is the signal that drives the contract's "Delivery Failed" display:
  // bounced/blocked here become `delivery_failed` in the webhook route.
  it("maps bounce events to email_bounced (a delivery failure)", () => {
    for (const event of ["hard_bounce", "soft_bounce", "bounce"]) {
      expect(normalizeBrevoWebhookEvent({ event })?.type).toBe("email_bounced");
    }
  });

  it("maps blocked/invalid/spam/error events to email_blocked (a delivery failure)", () => {
    for (const event of ["blocked", "invalid_email", "spam", "error"]) {
      expect(normalizeBrevoWebhookEvent({ event })?.type).toBe("email_blocked");
    }
  });

  it("maps request/sent to email_sent and delivered to email_delivered", () => {
    expect(normalizeBrevoWebhookEvent({ event: "request" })?.type).toBe(
      "email_sent",
    );
    expect(normalizeBrevoWebhookEvent({ event: "sent" })?.type).toBe(
      "email_sent",
    );
    expect(normalizeBrevoWebhookEvent({ event: "delivered" })?.type).toBe(
      "email_delivered",
    );
  });

  it("returns null for events outside the delivery-evidence chain", () => {
    for (const event of ["opened", "click", "deferred", "unsubscribed"]) {
      expect(normalizeBrevoWebhookEvent({ event })).toBeNull();
    }
  });

  it("returns null when the event field is missing or not a string", () => {
    expect(normalizeBrevoWebhookEvent({})).toBeNull();
    expect(normalizeBrevoWebhookEvent({ event: 123 })).toBeNull();
  });
});

describe("normalizeBrevoWebhookEvent — field extraction", () => {
  const metadata = {
    contractId: "contract-1",
    organizationId: "org-1",
    recipientEmail: "fallback@example.com",
  };

  it("pulls contract metadata back out of the X-Mailin-custom header", () => {
    const result = normalizeBrevoWebhookEvent({
      event: "hard_bounce",
      "X-Mailin-custom": JSON.stringify(metadata),
    });
    expect(result?.metadata?.contractId).toBe("contract-1");
    expect(result?.metadata?.organizationId).toBe("org-1");
  });

  it("falls back to the `tags` field for metadata", () => {
    const result = normalizeBrevoWebhookEvent({
      event: "blocked",
      tags: JSON.stringify(metadata),
    });
    expect(result?.metadata?.contractId).toBe("contract-1");
  });

  it("leaves metadata undefined when the custom payload is not valid JSON", () => {
    const result = normalizeBrevoWebhookEvent({
      event: "bounce",
      "X-Mailin-custom": "not-json",
    });
    expect(result?.metadata).toBeUndefined();
  });

  it("resolves recipientEmail from payload.email, then metadata, then empty", () => {
    expect(
      normalizeBrevoWebhookEvent({ event: "bounce", email: "to@example.com" })
        ?.recipientEmail,
    ).toBe("to@example.com");
    expect(
      normalizeBrevoWebhookEvent({
        event: "bounce",
        "X-Mailin-custom": JSON.stringify(metadata),
      })?.recipientEmail,
    ).toBe("fallback@example.com");
    expect(normalizeBrevoWebhookEvent({ event: "bounce" })?.recipientEmail).toBe(
      "",
    );
  });

  it("resolves provider message id and brevo event id from either key form", () => {
    expect(
      normalizeBrevoWebhookEvent({ event: "bounce", "message-id": "m-1" })
        ?.providerMessageId,
    ).toBe("m-1");
    expect(
      normalizeBrevoWebhookEvent({ event: "bounce", messageId: "m-2" })
        ?.providerMessageId,
    ).toBe("m-2");
    expect(
      normalizeBrevoWebhookEvent({ event: "bounce", id: "e-1" })?.brevoEventId,
    ).toBe("e-1");
    expect(
      normalizeBrevoWebhookEvent({ event: "bounce", "event-id": "e-2" })
        ?.brevoEventId,
    ).toBe("e-2");
  });
});
