// UI-only scaffolding for the Contracts section. No Firestore, no server
// actions — every value below is mock data that lives in the bundle so the
// pages render without persistence wired up.

export type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "void";

export interface MockContract {
  id: string;
  title: string;
  client: string;
  project: string;
  /** Total contract value in whole dollars. */
  value: number;
  status: ContractStatus;
  /** Display-ready last-updated label. */
  updatedAt: string;
}

export const MOCK_CONTRACTS: MockContract[] = [
  {
    id: "c-1042",
    title: "Full-Service Design Agreement",
    client: "The Whitmore Residence",
    project: "Lakehouse Renovation",
    value: 48500,
    status: "signed",
    updatedAt: "Jun 18, 2026",
  },
  {
    id: "c-1041",
    title: "Design & Procurement Contract",
    client: "Aria Hospitality Group",
    project: "Boutique Hotel Lobby",
    value: 132000,
    status: "viewed",
    updatedAt: "Jun 16, 2026",
  },
  {
    id: "c-1040",
    title: "Interior Refresh Agreement",
    client: "Marcus & Lena Cho",
    project: "Hillside Primary Suite",
    value: 21750,
    status: "sent",
    updatedAt: "Jun 15, 2026",
  },
  {
    id: "c-1039",
    title: "Full-Service Design Agreement",
    client: "Verde Development",
    project: "Riverside Model Unit",
    value: 64200,
    status: "draft",
    updatedAt: "Jun 12, 2026",
  },
  {
    id: "c-1038",
    title: "Consultation & Concept Contract",
    client: "The Halloran Family",
    project: "Brownstone Parlor Floor",
    value: 9800,
    status: "sent",
    updatedAt: "Jun 10, 2026",
  },
  {
    id: "c-1037",
    title: "Design & Procurement Contract",
    client: "Sable Coast Restaurants",
    project: "Coastal Bistro Buildout",
    value: 87600,
    status: "void",
    updatedAt: "Jun 04, 2026",
  },
  {
    id: "c-1036",
    title: "Full-Service Design Agreement",
    client: "Priya Nair",
    project: "Garden District Townhome",
    value: 39400,
    status: "draft",
    updatedAt: "Jun 02, 2026",
  },
];

// Builder dropdown options — also mock-only.
export const MOCK_CLIENTS = [
  "The Whitmore Residence",
  "Aria Hospitality Group",
  "Marcus & Lena Cho",
  "Verde Development",
  "The Halloran Family",
  "Priya Nair",
];

export const MOCK_PROJECTS = [
  "Lakehouse Renovation",
  "Boutique Hotel Lobby",
  "Hillside Primary Suite",
  "Riverside Model Unit",
  "Brownstone Parlor Floor",
  "Garden District Townhome",
];

export const MOCK_TEMPLATES = [
  "Full-Service Design Agreement",
  "Design & Procurement Contract",
  "Interior Refresh Agreement",
  "Consultation & Concept Contract",
];

export const PAYMENT_SCHEDULES = [
  "50% Deposit / 50% on Completion",
  "Monthly Installments",
  "Milestone-Based",
  "Net 30 on Invoice",
];

export const BILLING_TYPES = [
  "Fixed Design Fee",
  "Hourly",
  "Cost-Plus",
  "Monthly Retainer",
];
