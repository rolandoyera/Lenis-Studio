import { z } from "zod";

import type { Project } from "@/lib/types";
import { formatZip, isValidUsZip } from "@/lib/utils";

export const PROJECT_STATUSES = ["Active", "Completed", "Paused"] as const;

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
  notes: z.string(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const EMPTY_PROJECT_FORM: ProjectFormData = {
  clientId: "",
  name: "",
  status: "Active",
  budget: 0,
  sameAsMain: false,
  street: "",
  city: "",
  state: "",
  zip: "",
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
    notes: project.notes ?? "",
  };
}
