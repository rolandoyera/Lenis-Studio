// UI-only contract template scaffolding. The "document" is a list of pages,
// each a block of text with {{TOKEN}} markers and **bold** runs. A field
// manifest describes how each token is captured (label, input type, scope,
// where its value comes from). Client values are still mock; firm + signed-in
// user values come from the org profile / auth session.

import type { CompanyAddress, ContractTemplateKey } from "@/lib/types";

/** The code-based template this builder renders. */
export const CONTRACT_TEMPLATE_KEY: ContractTemplateKey =
  "interior-design-agreement";

/** Bump when TEMPLATE_PAGES / FIELD_DEFS change in a way that alters output. */
export const CONTRACT_TEMPLATE_VERSION = 1;

export type FieldType =
  | "text"
  | "date"
  | "currency"
  | "textarea"
  | "client"
  | "auto"
  | "list";

export type FieldScope = "global" | "page";

/** Where a field's value originates. */
export type FieldSource = "user" | "client" | "company" | "project";

export interface FieldDef {
  token: string;
  label: string;
  type: FieldType;
  scope: FieldScope;
  source: FieldSource;
  /** Required for page-scoped fields: which page surfaces this input. */
  page?: number;
  placeholder?: string;
  /** Helper copy shown below the active-page input in the builder. */
  explainer?: string;
  /** When true, the field may be left blank (skipped by save/print validation). */
  optional?: boolean;
}

export interface TemplatePage {
  page: number;
  /** Internal section label (not rendered). Useful for nav / debugging. */
  heading: string;
  /** Body text containing {{TOKEN}} markers and **bold** runs. */
  body: string;
}

// ─── Field manifest ──────────────────────────────────────────────────────────

export const FIELD_DEFS: Record<string, FieldDef> = {
  // Global — captured up top / auto-resolved, populate throughout the document.
  EFFECTIVE_DATE: {
    token: "EFFECTIVE_DATE",
    label: "Effective date",
    type: "date",
    scope: "global",
    source: "user",
  },
  CLIENT_NAME: {
    token: "CLIENT_NAME",
    label: "Client",
    type: "client",
    scope: "global",
    source: "client",
  },
  CLIENT_ADDRESS: {
    token: "CLIENT_ADDRESS",
    label: "Client address",
    type: "text",
    scope: "global",
    source: "client",
  },
  CLIENT_EMAIL: {
    token: "CLIENT_EMAIL",
    label: "Client email",
    type: "text",
    scope: "global",
    source: "client",
  },
  COMPANY_LEGAL_NAME: {
    token: "COMPANY_LEGAL_NAME",
    label: "Firm legal name",
    type: "auto",
    scope: "global",
    source: "company",
  },
  COMPANY_ADDRESS: {
    token: "COMPANY_ADDRESS",
    label: "Firm legal address",
    type: "auto",
    scope: "global",
    source: "company",
  },
  COMPANY_EMAIL: {
    token: "COMPANY_EMAIL",
    label: "Firm email",
    type: "auto",
    scope: "global",
    source: "company",
  },

  // Pulled from the selected project record in the CRM.
  PROJECT_ADDRESS: {
    token: "PROJECT_ADDRESS",
    label: "Project address",
    type: "auto",
    scope: "global",
    source: "project",
  },

  // Page-scoped — surface in the left panel as the user scrolls to that page.
  RETAINER_FEE: {
    token: "RETAINER_FEE",
    label: "Initial retainer",
    type: "currency",
    scope: "page",
    source: "user",
    page: 2,
    explainer: "The upfront payment due at signing before design work begins.",
  },
  BILLABLE_RATE: {
    token: "BILLABLE_RATE",
    label: "Hourly rate",
    type: "currency",
    scope: "page",
    source: "user",
    page: 2,
    explainer:
      "The hourly amount charged for design time, extra revisions, site visits, and other billable services not included in the retainer. This field is prefilled but is editable.",
  },
  STYLING_FEE: {
    token: "STYLING_FEE",
    label: "Styling & final placement fee",
    type: "currency",
    scope: "page",
    source: "user",
    page: 3,
    explainer:
      "The fee for final styling, furniture placement, accessory setup, and other finishing touches at the end of the project. This field is prefilled but is editable.",
  },
  PROJECT_DURATION_MONTHS: {
    token: "PROJECT_DURATION_MONTHS",
    label: "Project duration (months)",
    type: "text",
    scope: "page",
    source: "user",
    page: 4,
    placeholder: "e.g. 6",
    explainer:
      "The expected length of the project in months before any monthly extension fee may apply.",
  },
  MONTHLY_ADMINISTRATION_FEE: {
    token: "MONTHLY_ADMINISTRATION_FEE",
    label: "Monthly administration fee",
    type: "currency",
    scope: "page",
    source: "user",
    page: 4,
    explainer:
      "A monthly fee that applies if the project goes beyond the agreed timeline because of client delays, purchasing delays, or third-party delays. This field is prefilled but is editable.",
  },
  PROJECT_OBJECTIVES: {
    token: "PROJECT_OBJECTIVES",
    label: "Project objectives",
    type: "textarea",
    scope: "page",
    source: "user",
    page: 9,
    optional: true,
    placeholder: "Summarize the overall objectives for the project.",
    explainer: "Explainer paragraph for Project objectives",
  },
  SCOPE_ITEMS: {
    token: "SCOPE_ITEMS",
    label: "Scope of work",
    type: "list",
    scope: "page",
    source: "user",
    page: 9,
    optional: true,
    placeholder: "Describe a scope item",
    explainer: "Explainer paragraph for Scope of work",
  },
};

/** Tokens whose stored value is a raw number but renders as currency. */
export const CURRENCY_TOKENS = [
  "RETAINER_FEE",
  "BILLABLE_RATE",
  "STYLING_FEE",
  "MONTHLY_ADMINISTRATION_FEE",
];

// ─── Template pages ──────────────────────────────────────────────────────────

export const TEMPLATE_PAGES: TemplatePage[] = [
  {
    page: 1,
    heading: "Parties & Scope of Services",
    body: `This Interior Design Agreement ("Agreement") is entered into as of {{EFFECTIVE_DATE}} by and between {{COMPANY_LEGAL_NAME}}, a Florida limited liability company ("Designer"), and {{CLIENT_NAME}} ("Client").

Client has retained Designer to provide interior design services for the property located at {{PROJECT_ADDRESS}} ("Project"). Designer agrees to provide the services described in this Agreement and Exhibit A, Scope of Work, and Client agrees to pay Designer according to the fees and payment terms stated in this Agreement and Exhibit B, Fee Schedule and Project Terms.

**ARTICLE I**
**SCOPE OF SERVICES**

**1. Services.**
Designer agrees to provide interior design services for the Project as described in this Agreement and Exhibit A, Scope of Work.

Designer's services may include design direction, concept development, space planning, furniture layouts, finish and material selections, furniture, lighting, decor and accessory selections, sourcing, purchasing of approved items, design-related coordination, samples, drawings, renderings, mood boards, or other visual presentations, as applicable to the Project.

**1.1 No Construction Services.**
Client understands that Designer is not a licensed general contractor, architect, engineer, electrician, plumber, or other licensed construction professional. Designer does not perform, supervise, direct, or control construction, installation, trade work, code compliance, permitting, structural work, electrical work, or plumbing work.

Any construction, installation, repair, alteration, or trade work required for the Project must be performed by properly licensed professionals retained or approved by Client. Designer may coordinate design-related communication with such professionals, but Designer is not responsible for their work, scheduling, delays, errors, omissions, pricing, safety, permits, licenses, insurance, or code compliance.

**1.2 Purchasing.**
Designer will source, specify, and purchase approved furniture, fixtures, finishes, materials, decor, accessories, and other items for the Project unless otherwise agreed in writing. Client must approve items in writing and pay any required deposit or balance before Designer places an order.

If Client purchases Designer-recommended items directly from outside vendors without Designer's written approval, Client is solely responsible for all issues related to those purchases. If Client requests Designer's assistance with Client-purchased items, Designer may bill for that time at Designer's hourly rate.`,
  },
  {
    page: 2,
    heading: "Timeline, Responsibilities & Fees",
    body: `**1.3 Timeline and Access.**
Designer will make reasonable efforts to perform services in a timely manner. Client understands that timelines are estimates and may be affected by Client approvals, payments, vendor availability, product lead times, shipping delays, backorders, third-party schedules, site access, and other factors outside Designer's control.

Client agrees to provide Designer with reasonable access to the Project site when needed for design-related services, measurements, review of existing conditions, delivery coordination, final placement coordination, or other design-related coordination. Client is responsible for securing the Project site and providing safe and reasonable access.

**1.4 Client Responsibilities.**
Client agrees to provide timely decisions, approvals, payments, and site access; review and approve purchases before orders are placed; and retain any required licensed professionals for construction, installation, permitting, or trade work. Client agrees to provide accurate budget information and understands that Designer's recommendations and selections may be guided by the budget information provided by Client.

**ARTICLE II**
**FEES, PURCHASING, AND EXPENSES**

**2. Design Fee and Initial Retainer.**
Client shall pay Designer an initial retainer of {{RETAINER_FEE}} at the time this Agreement is signed and before Designer begins work. The retainer applies to Designer's design time and services only, unless otherwise stated in Exhibit A, Exhibit B, or an approved proposal.

Designer's hourly rate is {{BILLABLE_RATE}} per hour. If the retainer includes a set number of hours, the included hours shall be stated in Exhibit A, Exhibit B, or an approved proposal. Any time beyond the included hours will be billed at Designer's hourly rate. Designer may notify Client before additional billable time is incurred.

The retainer does not include furniture, fixtures, finishes, materials, decor, accessories, freight, delivery, storage, installation-related costs, sales tax, reimbursable expenses, purchasing fees, procurement fees, or any other project costs unless expressly stated in writing.

**2.1 Purchasing and Procurement Fees.**
Designer's purchasing services may include a markup, procurement fee, or purchasing-related fee. Unless otherwise stated in Exhibit A, Exhibit B, or an approved proposal, Designer's purchasing fee shall be included in the cost of approved items, plus applicable sales tax.

Client must approve all purchases in writing before orders are placed. Designer may require full payment or a deposit before placing any order. No item is considered ordered until Client has approved the item and paid the required amount.`,
  },
  {
    page: 3,
    heading: "Purchases, Delivery & Reimbursables",
    body: `**2.2 Payment for Approved Items.**
For approved purchases, Client shall pay Designer according to the payment terms stated in the applicable invoice, proposal, Exhibit C, Approved Purchases / Purchase Authorization, or another written purchase approval.

Unless otherwise stated, Client shall pay fifty percent (50%) of the total approved item cost, including Designer's purchasing fee and applicable sales tax, before the order is placed. The remaining balance shall be due before delivery, release of goods, or final placement of the item.

**2.3 Client Direct Purchases.**
Designer's standard process is to purchase approved items for the Project. If Client purchases any Designer-recommended item directly from an outside vendor without Designer's written approval, Client shall remain responsible for a direct purchase fee of twenty percent (20%) of the cost of such item, unless Designer waives the fee in writing.

Client is solely responsible for all issues related to Client-purchased items. If Client requests Designer's assistance with those items, Designer may bill for that time at Designer's hourly rate.

**2.4 Freight, Delivery, Storage, and Related Costs.**
Client is responsible for all freight, shipping, receiving, inspection, storage, warehousing, delivery, handling, and installation-related costs associated with approved items. These costs may be billed separately as they are incurred or included in a proposal or invoice.

**2.5 Styling and Final Placement Fee.**
If Client requests Designer to coordinate final styling, furniture placement, accessory setup, or other design-related final placement services, Designer may charge a separate styling and final placement fee of {{STYLING_FEE}}, due before such services begin.

**2.6 Damaged, Defective, Delayed, or Backordered Items.**
Client understands that approved items may be delayed, backordered, discontinued, damaged in transit, defective, or unavailable for reasons outside Designer's control.

For items purchased through Designer, Designer will make reasonable efforts to assist with claims, replacements, repairs, returns, or exchanges when available. Client remains responsible for any applicable freight, storage, delivery, handling, repair, replacement, or restocking costs unless covered by the vendor, manufacturer, carrier, or other responsible party.

**2.7 Reimbursable Expenses.**
Reimbursable expenses are separate from Designer's design fees and purchasing fees and may include renderings, drawings, printing, samples, postage, messenger service, travel, parking, tolls, shipping, receiving, storage, delivery coordination, and other Project-related expenses. Site visits not expressly included in Exhibit A may be billed at Designer's hourly rate, plus related travel expenses, including mileage, parking, tolls, and other reasonable costs. Travel time may also be billed at Designer's hourly rate unless otherwise stated in Exhibit A, Exhibit B, or an approved proposal.

Designer may invoice reimbursable expenses as they are incurred. Client shall pay such invoices upon receipt unless otherwise stated in the invoice.`,
  },
  {
    page: 4,
    heading: "Duration, Late Payment & Changes",
    body: `**2.8 Extended Project Duration Fee.**
If the Project extends beyond {{PROJECT_DURATION_MONTHS}} months for reasons outside Designer's control, including Client delays, postponed decisions, delayed approvals, delayed payments, purchasing delays, or third-party delays, Designer may charge a monthly project administration fee of {{MONTHLY_ADMINISTRATION_FEE}} until Designer's services are substantially completed. This fee is in addition to all other design fees, purchasing fees, and reimbursable expenses owed under this Agreement.

**2.9 Late Payments.**
If Client fails to make any payment when due, Designer may pause services, pause purchasing, withhold orders, withhold deliveries, or suspend Project work until the overdue amount is paid.

Designer may provide written notice of the late payment and allow Client up to fifteen (15) days to cure the overdue balance. If Client does not cure the late payment within that period, Designer may terminate this Agreement.

Client shall be responsible for reasonable costs incurred by Designer as a result of late payment, including collection costs, attorney's fees, and other amounts permitted by law.

**ARTICLE III**
**CHANGES, RETURNS, AND CANCELLATIONS**

**3. Changes.**
Any change, addition, or revision to the services, approved design direction, approved items, Exhibit A, or other approved Scope of Work must be approved in writing by Client and Designer before Designer is required to proceed. This Agreement includes up to two (2) rounds of revisions per design phase unless otherwise stated in Exhibit A, Exhibit B, or an approved proposal. Additional revisions, re-selections, redesigns, or changes requested by Client after approval shall be billed at Designer's hourly rate.

Designer may document the change by change order, revised proposal, invoice, email approval, client portal approval, or other written confirmation. Client shall pay any approved change-related fees or costs according to the applicable invoice, proposal, or written approval.

**3.1 Returns, Refunds, and Cancellations.**
Client understands that many items, including custom, special-order, made-to-order, final-sale, trade-only, discounted, or vendor-restricted items, may not be cancelled, returned, exchanged, or refunded once approved and ordered.

Requests for returns, exchanges, cancellations, repairs, replacements, or claims are reviewed on a per-item basis and are subject to the applicable third-party policies. Designer does not guarantee that any approved or ordered item can be cancelled, returned, exchanged, repaired, replaced, or refunded.

Designer's design fees, hourly fees, purchasing fees, procurement fees, reimbursable expenses, and other earned fees are non-refundable. If Client requests Designer's assistance with a return, cancellation, exchange, repair, replacement, or claim, Designer may bill for that time at Designer's hourly rate.`,
  },
  {
    page: 5,
    heading: "Liability, Warranties & Disputes",
    body: `**ARTICLE IV**
**LIABILITY, WARRANTIES, AND THIRD PARTIES**

**4. Limitation of Liability.**
To the fullest extent permitted by law, Designer shall not be liable for indirect, incidental, special, consequential, punitive, or lost-profit damages arising out of or related to this Agreement, the Project, Designer's services, approved purchases, vendor issues, delivery delays, product defects, or third-party work.

Designer's total liability under this Agreement shall not exceed the total amount of design fees actually paid by Client to Designer, excluding furniture, fixtures, finishes, materials, decor, accessories, freight, delivery, storage, reimbursable expenses, sales tax, purchasing fees, procurement fees, and third-party costs.

**4.1 Third Parties and Product Warranties.**
Designer is not responsible for errors, omissions, inaccuracies, delays, defects, or failures caused by any third party, including vendors, manufacturers, contractors, installers, trades, carriers, receivers, or other professionals involved in the Project.

Designer does not provide any warranty or guarantee for items manufactured, supplied, delivered, installed, repaired, or serviced by third parties. Any applicable third-party warranty shall be between Client and the applicable third party. Designer may assist with warranty-related communication upon request, but Designer is not responsible for initiating, pursuing, enforcing, or resolving warranty claims unless otherwise agreed in writing.

**4.2 Indemnification.**
Each Party agrees to indemnify and hold the other Party harmless from claims, damages, losses, liabilities, costs, and expenses, including reasonable attorney's fees, arising from that Party's negligence, willful misconduct, breach of this Agreement, or failure to comply with applicable law.

Client agrees to indemnify and hold Designer harmless from claims, damages, losses, liabilities, costs, and expenses arising from Client's property, Client's direct purchases, Client-retained vendors, contractors, installers, trade professionals, or other third parties not controlled by Designer.

**ARTICLE V**
**DISPUTES AND TERMINATION**

**5. Dispute Resolution.**
If a dispute arises out of or relates to this Agreement, the Project, Designer's services, approved purchases, or any payment obligation, the Parties agree to first attempt to resolve the dispute informally and in good faith.

A Party may begin the dispute process by sending written notice to the other Party describing the dispute. The Parties shall then have fifteen (15) days to attempt to resolve the matter informally, unless they agree in writing to extend that period.

If the dispute is not resolved informally, the dispute shall be resolved by binding arbitration in Broward County, Florida, unless the Parties agree otherwise in writing. The arbitration shall be conducted under the rules of the American Arbitration Association or another arbitration provider agreed to by the Parties.

The prevailing Party in any arbitration or legal proceeding arising out of this Agreement shall be entitled to recover its reasonable attorney's fees, costs, and expenses, to the extent permitted by law. By agreeing to arbitration, the Parties understand that they are waiving the right to have the dispute decided by a judge or jury, except as otherwise required by law.`,
  },
  {
    page: 6,
    heading: "Termination, General Terms & Notices",
    body: `**5.1 Termination.**
Designer may suspend services, pause purchasing, withhold orders, withhold deliveries, or terminate this Agreement if Client fails to make payments when due, fails to provide required approvals, denies reasonable access to the Project site, or otherwise fails to comply with this Agreement.

Designer may provide written notice describing the issue and allow Client fifteen (15) days to cure the issue, unless immediate suspension is reasonably necessary due to non-payment, safety concerns, lack of access, or circumstances outside Designer's control.

Termination does not relieve Client of payment obligations incurred before termination. Client remains responsible for all approved purchases, earned design fees, purchasing fees, procurement fees, reimbursable expenses, and other amounts owed under this Agreement.

**ARTICLE VI**
**GENERAL TERMS**

**6. Governing Law and Venue.**
This Agreement shall be governed by the laws of the State of Florida. Venue for any court proceeding related to this Agreement shall be in Broward County, Florida, unless otherwise required by law.

**6.1 Notices.**
All notices required under this Agreement shall be in writing and sent to the contact information listed below or to any updated contact information provided in writing by either Party.

**For Designer:**
{{COMPANY_LEGAL_NAME}}
{{COMPANY_ADDRESS}}
{{COMPANY_EMAIL}}

**For Client:**
{{CLIENT_NAME}}
{{CLIENT_ADDRESS}}
{{CLIENT_EMAIL}}`,
  },
  {
    page: 7,
    heading: "Miscellaneous Provisions",
    body: `**6.2 Independent Contractor Relationship.**
Designer is an independent contractor and is not Client's employee, agent, partner, joint venturer, fiduciary, or legal representative.

**6.3 Assignment.**
Neither Party may assign or transfer this Agreement without the prior written consent of the other Party, except as otherwise permitted by law.

**6.4 Severability.**
If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in effect.

**6.5 Intellectual Property & Photography.**
Designer retains ownership of all drawings, plans, specifications, renderings, schedules, concepts, designs, documents, and other materials prepared by Designer. Client may use such materials only for the Project identified in this Agreement. Client may not copy, reproduce, distribute, or use Designer's materials for any other project or purpose without Designer's written approval. Designer is not required to release editable source files, CAD files, or working files unless separately agreed in writing.

Designer may photograph or arrange photography of the completed Project and may use photographs, renderings, and project images for Designer's portfolio, website, social media, marketing, publications, awards, and promotional materials. Designer will not disclose Client's name or private personal information without Client's written approval.

**6.6 Amendments.**
This Agreement may be amended only by a written agreement approved by both Parties.

**6.7 Entire Agreement.**
This Agreement, together with Exhibit A, Scope of Work; Exhibit B, Fee Schedule and Project Terms; any approved proposal; invoice; Exhibit C, Approved Purchases / Purchase Authorization; Exhibit D, Change Order / Revision Approval; or other written approval, represents the entire agreement between the Parties regarding the Project and supersedes all prior discussions, proposals, or understandings related to the Project.`,
  },
  {
    page: 8,
    heading: "Signatures",
    body: `**IN WITNESS WHEREOF,** the Parties agree to the terms of this Agreement as of the Effective Date.

Designer: {{COMPANY_LEGAL_NAME}}          Client: {{CLIENT_NAME}}

Signature: _______________________     Signature: _______________________

Print Name: ______________________     Print Name: ______________________

Title: ___________________________     Date: ____________________________

Date: ____________________________`,
  },
  {
    page: 9,
    heading: "Exhibit A — Scope of Work",
    body: `**EXHIBIT A**
**SCOPE OF WORK**

Subject to the terms and conditions of the attached Interior Design Agreement, Designer shall provide Client with the interior design services described below.

Project Objectives: {{PROJECT_OBJECTIVES}}

{{SCOPE_ITEMS}}`,
  },
];

/** Matches {{TOKEN}} markers; capturing group keeps them when splitting. */
export const TOKEN_SPLIT_RE = /(\{\{[A-Z0-9_]+\}\})/g;
const TOKEN_NAME_RE = /^\{\{([A-Z0-9_]+)\}\}$/;

/**
 * Splits a body into render segments: {{TOKEN}} markers, **bold** spans, and
 * plain text. Capturing group keeps the markers/spans. Bold uses `[^*]+` so it
 * can't swallow a token (tokens contain no `*`) — don't nest the two.
 */
export const SEGMENT_SPLIT_RE = /(\{\{[A-Z0-9_]+\}\}|\*\*[^*]+\*\*)/g;
const BOLD_RE = /^\*\*([^*]+)\*\*$/;

/** If `part` is a **bold** span, return its inner text; otherwise null. */
export function boldText(part: string): string | null {
  const match = part.match(BOLD_RE);
  return match ? match[1] : null;
}

/** If `part` is a token marker, return its name; otherwise null. */
export function tokenName(part: string): string | null {
  const match = part.match(TOKEN_NAME_RE);
  return match ? match[1] : null;
}

/** Unique tokens appearing on a page, in first-seen order. */
export function tokensOnPage(page: TemplatePage): string[] {
  const seen = new Set<string>();
  for (const part of page.body.split(TOKEN_SPLIT_RE)) {
    const name = tokenName(part);
    if (name) seen.add(name);
  }
  return [...seen];
}

/** "2026-06-23" → "June 23, 2026" (the date phrasing used in the document). */
export function formatPlainDate(iso: string | undefined): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Compose a single-line address from a client's discrete fields. */
export function formatClientAddress(parts: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}): string {
  const cityLine = [
    parts.city,
    [parts.state, parts.zip].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return [parts.street, cityLine].filter(Boolean).join(", ");
}

/** The firm's legal address from the org company profile (prefers its denormalized form). */
export function formatCompanyAddress(
  address: CompanyAddress | undefined,
): string {
  if (!address) return "";
  if (address.formatted?.trim()) return address.formatted.trim();
  const cityLine = [
    address.city,
    [address.state, address.postalCode].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return [address.line1, address.line2, cityLine].filter(Boolean).join(", ");
}
