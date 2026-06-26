// Server-only generation of the final, fully-executed contract PDF. Built with
// @react-pdf/renderer (no headless browser) from the frozen `lockedSnapshot` plus
// both signatures, and capped with a signature certificate that summarizes the
// evidence trail. The PDF is written to private Storage; clients reach it only
// through a token-gated download route, never a public URL.

import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { Contract, ContractAuditEvent } from "@/lib/types";

import { getContractAuditEvents } from "./contract-audit";
import { getAdminBucket } from "./firebase-admin";

function fmtDate(ms?: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Substitute {{TOKEN}} markers and strip **bold** runs into flat display text. */
function renderLine(line: string, resolved: Record<string, string>): string {
  return line
    .replace(/\{\{(\w+)\}\}/g, (_, name: string) => resolved[name] ?? "")
    .replace(/\*\*(.+?)\*\*/g, "$1");
}

/** A line that was a single all-caps bold run is a centered heading. */
function isHeading(line: string): boolean {
  const m = line.trim().match(/^\*\*(.+)\*\*$/);
  return m ? m[1] === m[1].toUpperCase() && /[A-Z]/.test(m[1]) : false;
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 56,
    paddingVertical: 64,
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1f2937",
    fontFamily: "Helvetica",
  },
  heading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginVertical: 6,
  },
  paragraph: { marginBottom: 4 },
  pageFooter: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    marginTop: 4,
  },
  sigBlock: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    marginBottom: 20,
  },
  sigLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    marginBottom: 6,
  },
  sigName: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 18,
    marginBottom: 6,
  },
  row: { flexDirection: "row", marginBottom: 2 },
  rowLabel: { width: 130, color: "#6b7280" },
  rowValue: { flex: 1 },
  certGroupTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

interface CertData {
  brevoDeliveryStatus: string;
  brevoMessageId: string;
  deliveredAt?: number;
}

/** Derive email-delivery facts from the audit trail for the certificate. */
function deriveDelivery(events: ContractAuditEvent[]): CertData {
  const delivered = events.find((e) => e.type === "email_delivered");
  const bounced = events.find((e) => e.type === "email_bounced");
  const blocked = events.find((e) => e.type === "email_blocked");
  const sent = events.find((e) => e.type === "email_sent");
  const last = delivered ?? bounced ?? blocked ?? sent;

  let status = "Not reported";
  if (delivered) status = "Delivered by Brevo";
  else if (bounced) status = "Bounced";
  else if (blocked) status = "Blocked";
  else if (sent) status = "Sent by Brevo";

  return {
    brevoDeliveryStatus: status,
    brevoMessageId:
      (last && "providerMessageId" in last && last.providerMessageId) || "—",
    deliveredAt: delivered?.occurredAt,
  };
}

function ContractPdf({
  contract,
  cert,
}: {
  contract: Contract;
  cert: CertData;
}) {
  const snapshot = contract.lockedSnapshot;
  if (!snapshot) throw new Error("Contract has no locked snapshot.");
  const { resolved } = snapshot;
  const total = snapshot.pages.length + 1; // +1 for the certificate page
  const client = contract.clientSignature;
  const company = contract.companySignatureAuthorization;

  return (
    <Document>
      {snapshot.pages.map((page) => (
        <Page key={page.page} size="A4" style={styles.page} wrap>
          {page.body.split("\n").map((line, i) =>
            isHeading(line) ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: frozen template, stable order
              <Text key={i} style={styles.heading}>
                {renderLine(line, resolved)}
              </Text>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: frozen template, stable order
              <Text key={i} style={styles.paragraph}>
                {renderLine(line, resolved) || " "}
              </Text>
            ),
          )}
          <Text
            style={styles.pageFooter}
            render={({ pageNumber }) => `Page ${pageNumber} of ${total}`}
            fixed
          />
        </Page>
      ))}

      {/* Signatures + certificate */}
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.sectionTitle}>Signatures</Text>

        <View style={styles.sigBlock}>
          <Text style={styles.sigLabel}>CLIENT</Text>
          <Text style={styles.sigName}>{client?.signerName ?? "—"}</Text>
          <Field label="Signed by:" value={client?.signerName ?? "—"} />
          <Field label="Email:" value={client?.signerEmail ?? "—"} />
          <Field label="Date:" value={fmtDate(client?.signedAt)} />
        </View>

        <View style={styles.sigBlock}>
          <Text style={styles.sigLabel}>
            {snapshot.parties.companyLegalName || "SARVIAN DESIGN GROUP"}
          </Text>
          <Text style={styles.sigName}>{company?.signerName ?? "—"}</Text>
          <Field label="Signed by:" value={company?.signerName ?? "—"} />
          <Field label="Title:" value={company?.signerTitle ?? "—"} />
          <Field label="Email:" value={company?.signerEmail ?? "—"} />
          <Field label="Date:" value={fmtDate(contract.executedAt)} />
          <Field label="Signature Type:" value="Authorized on Send" />
        </View>

        <Text style={styles.sectionTitle}>Signature Certificate</Text>
        <Field label="Contract ID:" value={contract.contractId} />
        <Field
          label="Contract Version ID:"
          value={contract.contractVersionId ?? "—"}
        />
        <Field label="Document Hash:" value={contract.contractHash ?? "—"} />

        <Text style={styles.certGroupTitle}>Delivery</Text>
        <Field label="Sent to:" value={contract.sentToEmail ?? "—"} />
        <Field label="Sent at:" value={fmtDate(contract.sentAt)} />
        <Field label="Provider:" value="Brevo" />
        <Field label="Status:" value={cert.brevoDeliveryStatus} />
        <Field label="Message ID:" value={cert.brevoMessageId} />
        <Field label="Delivered at:" value={fmtDate(cert.deliveredAt)} />

        <Text style={styles.certGroupTitle}>Client Signature</Text>
        <Field label="Signer:" value={client?.signerName ?? "—"} />
        <Field label="Email:" value={client?.signerEmail ?? "—"} />
        <Field label="Signed at:" value={fmtDate(client?.signedAt)} />
        <Field
          label="Consent accepted:"
          value={fmtDate(client?.consentAcceptedAt)}
        />
        <Field label="IP Address:" value={client?.ipAddress ?? "—"} />
        <Field label="Browser/User Agent:" value={client?.userAgent ?? "—"} />

        <Text style={styles.certGroupTitle}>Company Signature</Text>
        <Field label="Signer:" value={company?.signerName ?? "—"} />
        <Field label="Title:" value={company?.signerTitle ?? "—"} />
        <Field label="Authorized at:" value={fmtDate(company?.authorizedAt)} />
        <Field label="Applied at:" value={fmtDate(contract.executedAt)} />
        <Field label="Authorization Type:" value="Authorized on Send" />

        <Text
          style={styles.pageFooter}
          render={({ pageNumber }) => `Page ${pageNumber} of ${total}`}
          fixed
        />
      </Page>
    </Document>
  );
}

/**
 * Render the final dual-signature PDF and store it privately. Returns the Storage
 * path (recorded on the contract + the fully-executed audit event).
 */
export async function generateAndStoreFinalContractPdf(input: {
  contract: Contract;
}): Promise<string> {
  const { contract } = input;
  const events = await getContractAuditEvents(contract.contractId);
  const cert = deriveDelivery(events);

  const buffer = await renderToBuffer(
    <ContractPdf contract={contract} cert={cert} />,
  );

  const path = `organizations/${contract.organizationId}/contracts/${contract.contractId}/final/contract-${contract.contractVersionId}.pdf`;
  await getAdminBucket()
    .file(path)
    .save(buffer, { contentType: "application/pdf" });
  return path;
}
