import { z } from "zod";

import type { Project, ProjectStatus } from "@/lib/types";
import { formatZip, isValidUsZip } from "@/lib/utils";

export const PROJECT_STATUSES = [
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const satisfies readonly ProjectStatus[];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Distinct badge colors per status, mirroring the pill styling used across the projects UI. */
export const PROJECT_STATUS_META: Record<ProjectStatus, { badgeClass: string }> = {
  in_progress: { badgeClass: "border border-emerald-500/20 bg-emerald-500/15 text-emerald-500" },
  on_hold: { badgeClass: "border border-amber-500/20 bg-amber-500/15 text-amber-500" },
  completed: { badgeClass: "border border-blue-500/20 bg-blue-500/15 text-blue-500" },
  cancelled: { badgeClass: "border border-rose-500/20 bg-rose-500/15 text-rose-500" },
};

export const PROJECT_TABS = [
  { value: "overview", label: "Overview" },
  { value: "selections", label: "Selections" },
  { value: "calendar", label: "Calendar" },
  { value: "files", label: "Files" },
  { value: "settings", label: "Settings" },
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number]["value"];

export function isProjectTab(value: string | null): value is ProjectTab {
  return PROJECT_TABS.some((tab) => tab.value === value);
}

export const projectSchema = z.object({
  clientId: z.string().min(1, "Please select a parent client."),
  name: z.string().min(1, "Project title is required."),
  status: z.enum(PROJECT_STATUSES),
  budget: z.number().min(0, "Budget must be positive."),
  sameAsMain: z.boolean(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string().refine(isValidUsZip, "Enter a valid 5-digit ZIP code."),
  country: z.string(),
  notes: z.string(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const EMPTY_PROJECT_FORM: ProjectFormData = {
  clientId: "",
  name: "",
  status: "in_progress",
  budget: 0,
  sameAsMain: false,
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  notes: "",
};

/** Map an existing project onto the editable form shape. */
export function projectToForm(project: Project): ProjectFormData {
  const streetVal =
    project.street !== undefined && project.street !== ""
      ? project.street
      : !project.city && !project.state && !project.zip
        ? project.address
        : "";
  return {
    clientId: project.clientId,
    name: project.name,
    status: project.status,
    budget: project.budget ?? 0,
    sameAsMain: project.sameAsMain ?? false,
    street: streetVal ?? "",
    city: project.city ?? "",
    state: project.state ?? "",
    zip: formatZip(project.zip ?? ""),
    country: project.country ?? "US",
    notes: project.notes ?? "",
  };
}
