// Canonical user-facing legal strings for the contract signing flow. Kept in one
// pure module (no server/node imports) so the client UI renders the exact text
// that the server freezes into the audit trail / signature record — they must
// never drift apart. If the wording changes, the stored `consentText` on new
// signatures changes with it; already-signed records keep their frozen copy.

/** Shown in the dashboard send-confirmation modal. Sending = company authorization. */
export const COMPANY_SEND_AUTHORIZATION_TEXT =
  "By sending this contract, you confirm that Sarvian Design Group approves this version and authorizes the company signature to be applied if the client signs.";

/** The exact consent a client must accept before signing. Frozen onto the record. */
export const ELECTRONIC_SIGNATURE_CONSENT_TEXT =
  "By signing, you agree to the terms of this Contract and consent to electronic records and electronic signatures.";
