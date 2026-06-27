// Pure, client-safe presentation for the final contract PDF. Holds only the
// @react-pdf/renderer component tree + styles — no firebase-admin, no Storage,
// no Node-only `renderToBuffer`. This lets both the server generator
// (`contract-pdf.tsx`) and the dev on-screen preview render the exact same
// document, so what you style is byte-for-byte what clients receive.

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Contract, ContractAuditEvent } from "@/lib/types";

function fmtDate(ms?: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Substitute {{TOKEN}} markers, leaving **bold** markup intact. */
function resolveTokens(line: string, resolved: Record<string, string>): string {
  return line.replace(
    /\{\{(\w+)\}\}/g,
    (_, name: string) => resolved[name] ?? "",
  );
}

/** Substitute tokens and strip **bold** runs into flat text (used for headings). */
function renderLine(line: string, resolved: Record<string, string>): string {
  return resolveTokens(line, resolved).replace(/\*\*(.+?)\*\*/g, "$1");
}

/**
 * Split a line into normal/bold segments. Both **...** runs and resolved
 * {{TOKEN}} values render bold; everything else is normal weight.
 */
function richSegments(
  line: string,
  resolved: Record<string, string>,
): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const re = /\*\*(.+?)\*\*|\{\{(\w+)\}\}/g;
  let last = 0;
  let m: RegExpExecArray | null = re.exec(line);
  while (m !== null) {
    if (m.index > last)
      parts.push({ text: line.slice(last, m.index), bold: false });
    // m[1] = **bold** run (may itself contain tokens); m[2] = {{TOKEN}} name.
    const text =
      m[1] !== undefined
        ? resolveTokens(m[1], resolved)
        : (resolved[m[2]] ?? "");
    parts.push({ text, bold: true });
    last = m.index + m[0].length;
    m = re.exec(line);
  }
  if (last < line.length) parts.push({ text: line.slice(last), bold: false });
  return parts;
}

/** A line that was a single all-caps bold run is a centered heading. */
function isHeading(line: string): boolean {
  const m = line.trim().match(/^\*\*(.+)\*\*$/);
  return m ? m[1] === m[1].toUpperCase() && /[A-Z]/.test(m[1]) : false;
}

/** An exhibit heading (e.g. "**EXHIBIT A**") starts on its own page. */
function isExhibitHeading(line: string): boolean {
  const m = line.trim().match(/^\*\*(.+)\*\*$/);
  return m ? /^EXHIBIT\b/.test(m[1].trim()) : false;
}

/** A numbered subsection lead-in (e.g. "**2.2 Payment for Approved Items.**"). */
function isSubsectionLine(line: string): boolean {
  return /^\*\*\d+\.\d+\s/.test(line.trim());
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
  paragraphSpaced: { marginBottom: 4, marginTop: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    marginTop: 40,
  },
  sigColumns: { flexDirection: "row", marginTop: 8 },
  sigCol: { flex: 1 },
  sigGap: { width: 28 },
  sigParty: { marginBottom: 16 },
  sigScript: { fontFamily: "Helvetica-Oblique", fontSize: 20, marginBottom: 2 },
  sigRule: { borderBottomWidth: 1, borderBottomColor: "#9ca3af" },
  sigCaption: { fontSize: 8, color: "#6b7280", marginTop: 3, marginBottom: 10 },
  sigMeta: { marginBottom: 2 },
  sigMetaLabel: { color: "#6b7280" },
  certRow: { flexDirection: "row", marginBottom: -2, fontSize: 8 },
  certRowLabel: { width: 80, color: "#6b7280" },
  certRowValue: { flex: 1 },
  certGroupTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  certGroupTitleSub: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 0,
  },
  certText: {
    fontSize: 8,
  },
});

/** The in-body signature page (the "IN WITNESS WHEREOF ..." block). */
function isSignatureBlockBody(body: string): boolean {
  return body.includes("IN WITNESS WHEREOF");
}

/** One party's filled signature: typed name over a rule, then the meta fields. */
function PartySignature({
  label,
  party,
  signerName,
  title,
  date,
}: {
  label: string;
  party: string;
  signerName: string;
  title?: string;
  date: string;
}) {
  return (
    <View style={styles.sigCol}>
      <Text style={styles.sigParty}>
        <Text style={styles.sigMetaLabel}>{label}: </Text>
        <Text style={styles.bold}>{party}</Text>
      </Text>
      <Text style={styles.sigScript}>{signerName || "—"}</Text>
      <View style={styles.sigRule} />
      <Text style={styles.sigCaption}>Signature</Text>
      <Text style={styles.sigMeta}>
        <Text style={styles.sigMetaLabel}>Print Name: </Text>
        {signerName || "—"}
      </Text>
      {title ? (
        <Text style={styles.sigMeta}>
          <Text style={styles.sigMetaLabel}>Title: </Text>
          {title}
        </Text>
      ) : null}
      <Text style={styles.sigMeta}>
        <Text style={styles.sigMetaLabel}>Date: </Text>
        {date}
      </Text>
    </View>
  );
}

/** Two-column filled signature block, replacing the template's blank lines. */
function SignatureBlock({
  snapshot,
  contract,
  client,
  company,
}: {
  snapshot: NonNullable<Contract["lockedSnapshot"]>;
  contract: Contract;
  client: Contract["clientSignature"];
  company: Contract["companySignatureAuthorization"];
}) {
  const { resolved } = snapshot;
  const designerParty =
    snapshot.parties.companyLegalName || resolved.COMPANY_LEGAL_NAME || "—";
  const clientParty = resolved.CLIENT_NAME || client?.signerName || "—";

  return (
    <View wrap={false} style={styles.sigColumns}>
      <PartySignature
        label="Designer"
        party={designerParty}
        signerName={company?.signerName ?? ""}
        title={company?.signerTitle}
        date={fmtDate(contract.executedAt)}
      />
      <View style={styles.sigGap} />
      <PartySignature
        label="Client"
        party={clientParty}
        signerName={client?.signerName ?? ""}
        date={fmtDate(client?.signedAt)}
      />
    </View>
  );
}

/** A body paragraph, rendering **bold** runs and {{TOKEN}} values as bold Text. */
function ParagraphLine({
  line,
  resolved,
  spaced,
}: {
  line: string;
  resolved: Record<string, string>;
  spaced?: boolean;
}) {
  const segments = richSegments(line, resolved);
  if (segments.length === 0) return <Text style={styles.paragraph}> </Text>;
  return (
    <Text style={spaced ? styles.paragraphSpaced : styles.paragraph}>
      {segments.map((seg, j) =>
        seg.bold ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: frozen template, stable order
          <Text key={j} style={styles.bold}>
            {seg.text}
          </Text>
        ) : (
          seg.text
        ),
      )}
    </Text>
  );
}

function CertField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.certRow}>
      <Text style={styles.certRowLabel}>{label}</Text>
      <Text style={styles.certRowValue}>{value}</Text>
    </View>
  );
}

export interface CertData {
  brevoDeliveryStatus: string;
  brevoMessageId: string;
  deliveredAt?: number;
}

/** Derive email-delivery facts from the audit trail for the certificate. */
export function deriveDelivery(events: ContractAuditEvent[]): CertData {
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

export function ContractPdf({
  contract,
  cert,
}: {
  contract: Contract;
  cert: CertData;
}) {
  const snapshot = contract.lockedSnapshot;
  if (!snapshot) throw new Error("Contract has no locked snapshot.");
  const { resolved } = snapshot;
  const client = contract.clientSignature;
  const company = contract.companySignatureAuthorization;

  return (
    <Document>
      {/* The body flows continuously: authored `pages` are concatenated and
          react-pdf breaks only when an A4 sheet fills, so short sections no
          longer leave a tall gap before a forced page break. */}
      <Page size="A4" style={styles.page} wrap>
        {snapshot.pages.map((page) =>
          isSignatureBlockBody(page.body) ? (
            // Render the witness statement, then a filled signature block in place
            // of the template's blank underscore lines.
            <View key={page.page} wrap={false} style={{ marginTop: 8 }}>
              <ParagraphLine
                line={page.body.split("\n")[0]}
                resolved={resolved}
              />
              <SignatureBlock
                snapshot={snapshot}
                contract={contract}
                client={client}
                company={company}
              />
            </View>
          ) : (
            (() => {
              const lines = page.body.split("\n");
              return lines.map((line, i) =>
                isHeading(line) ? (
                  <Text
                    // biome-ignore lint/suspicious/noArrayIndexKey: frozen template, stable order
                    key={`${page.page}-${i}`}
                    style={styles.heading}
                    break={isExhibitHeading(line)}>
                    {renderLine(line, resolved)}
                  </Text>
                ) : (
                  <ParagraphLine
                    // biome-ignore lint/suspicious/noArrayIndexKey: frozen template, stable order
                    key={`${page.page}-${i}`}
                    line={line}
                    resolved={resolved}
                    spaced={
                      isSubsectionLine(line) &&
                      (i === 0 || lines[i - 1].trim() !== "")
                    }
                  />
                ),
              );
            })()
          ),
        )}
      </Page>

      {/* Signature certificate (the e-sign evidence trail). */}
      <Page size="A4" style={styles.page} wrap>
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>
          Signature Certificate
        </Text>
        <CertField label="Contract ID:" value={contract.contractId} />
        <CertField
          label="Contract Version ID:"
          value={contract.contractVersionId ?? "—"}
        />
        <CertField
          label="Document Hash:"
          value={contract.contractHash ?? "—"}
        />

        <Text style={styles.certGroupTitleSub}>Delivery</Text>
        <CertField label="Sent to:" value={contract.sentToEmail ?? "—"} />
        <CertField label="Sent at:" value={fmtDate(contract.sentAt)} />
        <CertField label="Provider:" value="Brevo" />
        <CertField label="Status:" value={cert.brevoDeliveryStatus} />
        <CertField label="Message ID:" value={cert.brevoMessageId} />
        <CertField label="Delivered at:" value={fmtDate(cert.deliveredAt)} />

        <Text style={styles.certGroupTitleSub}>Client Signature</Text>
        <CertField label="Signer:" value={client?.signerName ?? "—"} />
        <CertField label="Email:" value={client?.signerEmail ?? "—"} />
        <CertField label="Signed at:" value={fmtDate(client?.signedAt)} />
        <CertField
          label="Consent accepted:"
          value={fmtDate(client?.consentAcceptedAt)}
        />
        <CertField label="IP Address:" value={client?.ipAddress ?? "—"} />
        <CertField
          label="Browser/User Agent:"
          value={client?.userAgent ?? "—"}
        />

        <Text style={styles.certGroupTitleSub}>Company Signature</Text>
        <CertField label="Signer:" value={company?.signerName ?? "—"} />
        <CertField label="Title:" value={company?.signerTitle ?? "—"} />
        <CertField
          label="Authorized at:"
          value={fmtDate(company?.authorizedAt)}
        />
        <CertField label="Applied at:" value={fmtDate(contract.executedAt)} />
        <CertField label="Authorization Type:" value="Authorized on Send" />
      </Page>
    </Document>
  );
}
