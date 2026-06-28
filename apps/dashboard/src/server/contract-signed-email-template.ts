// Branded HTML for the post-sign confirmation email.
//
// Sent to the client once the contract is fully executed, with the final executed
// PDF attached. Same email-safe construction as the signing-link template: a
// table-based layout with INLINE styles only (Gmail/Outlook strip <style> blocks),
// a white content card on a tinted page, and a muted footer.

interface ContractSignedEmailParams {
  clientName: string;
  companyName: string;
  /** Human-friendly name of the attached executed PDF, surfaced in the body. */
  fileName: string;
  /** Absolute https logo URL (dark logo, centered in the tinted header). Optional. */
  logoUrl?: string;
  /** Company phone for the "questions?" line. Omitted when unset. */
  companyPhone?: string;
  /** `tel:`-safe form of the company phone (digits, leading + for intl). */
  companyPhoneTel?: string;
}

const PAGE_BG = "#F0E9DB";
const ACCENT = "#A37F51";
const FONT = "Arial, Helvetica, sans-serif";

/** Render the full HTML body for the "contract signed" confirmation email. */
export function buildContractSignedEmailHtml({
  clientName,
  companyName,
  fileName,
  logoUrl,
  companyPhone,
  companyPhoneTel,
}: ContractSignedEmailParams): string {
  const firstName = clientName.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hello ${firstName},` : "Hello,";
  const year = new Date().getFullYear();
  const callSentence = companyPhone
    ? ` If you have any questions, please call <a href="tel:${companyPhoneTel}" style="color:${ACCENT};text-decoration:underline;">${companyPhone}</a>.`
    : "";

  const brand = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" height="112" style="display:block;border:0;outline:none;text-decoration:none;height:112px;width:auto;margin:0 auto;" />`
    : `<span style="font-family:${FONT};font-size:22px;font-weight:bold;color:#2B2B2B;">${companyName}</span>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:${PAGE_BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAGE_BG};">
      <tr>
        <td align="center" style="padding:12px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
            <tr>
              <td align="center" style="padding:8px 8px 8px 8px;">${brand}</td>
            </tr>
            <tr>
              <td style="background-color:#FFFFFF;border-radius:8px;padding:40px;">
                <h1 style="margin:0 0 24px;font-family:${FONT};font-size:30px;line-height:1.2;font-weight:bold;color:#1F1B16;">Your contract is fully signed.</h1>
                <p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.6;color:#3A352E;">${greeting}</p>
                <p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.6;color:#3A352E;">A copy of the signed contract is attached to this email for your records. We look forward to making something beautiful together.</p>
                <p style="margin:0 0 8px;font-family:${FONT};font-size:16px;line-height:1.6;color:#3A352E;">Attached: <strong>${fileName}</strong></p>
                <p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.6;color:#3A352E;">Please keep this copy for your records.${callSentence}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px;font-family:${FONT};font-size:13px;line-height:1.6;color:#8A8174;">
                <p style="margin:0;">&copy; ${year} ${companyName}. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
