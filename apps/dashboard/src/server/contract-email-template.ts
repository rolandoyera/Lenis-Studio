// Branded HTML for the contract signing-link email.
//
// Built to survive real email clients: a table-based layout with INLINE styles
// only (Gmail/Outlook strip <style> blocks and external CSS). White content card
// on a tinted page, a solid call-to-action button, and a muted footer with a
// copy-paste fallback link.

interface ContractEmailParams {
  clientName: string;
  companyName: string;
  portalUrl: string;
  /** Absolute https logo URL (dark logo, centered in the tinted header). Optional. */
  logoUrl?: string;
}

const PAGE_BG = "#F0E9DB";
const BUTTON_BG = "#A37F51";
const FONT = "Arial, Helvetica, sans-serif";

/** Render the full HTML body for the "ready to sign" email. */
export function buildContractEmailHtml({
  clientName,
  companyName,
  portalUrl,
  logoUrl,
}: ContractEmailParams): string {
  const greeting = clientName ? `Hello ${clientName},` : "Hello,";
  const year = new Date().getFullYear();

  const brand = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" height="64" style="display:block;border:0;outline:none;text-decoration:none;height:64px;width:auto;margin:0 auto;" />`
    : `<span style="font-family:${FONT};font-size:22px;font-weight:bold;color:#2B2B2B;">${companyName}</span>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:${PAGE_BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAGE_BG};">
      <tr>
        <td align="center" style="padding:24px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
            <tr>
              <td align="center" style="padding:8px 8px 24px;">${brand}</td>
            </tr>
            <tr>
              <td style="background-color:#FFFFFF;border-radius:8px;padding:40px;">
                <h1 style="margin:0 0 24px;font-family:${FONT};font-size:30px;line-height:1.2;font-weight:bold;color:#1F1B16;">${companyName} has sent you a contract to sign.</h1>
                <p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.6;color:#3A352E;">${greeting}</p>
                <p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.6;color:#3A352E;">${companyName} has prepared a contract for you to review and sign electronically. You can read the full agreement using the secure link below.</p>
                <p style="margin:0 0 32px;font-family:${FONT};font-size:16px;line-height:1.6;color:#3A352E;">This link is private to you. If you weren't expecting this, you can safely ignore this email.</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="${BUTTON_BG}" style="border-radius:4px;">
                      <a href="${portalUrl}" style="display:inline-block;padding:16px 32px;font-family:${FONT};font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:4px;">Review &amp; Sign Contract &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 8px;font-family:${FONT};font-size:13px;line-height:1.6;color:#8A8174;">
                <p style="margin:0 0 8px;">If the button doesn't work, copy and paste this link into your browser:<br /><a href="${portalUrl}" style="color:${BUTTON_BG};text-decoration:underline;">${portalUrl}</a></p>
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
