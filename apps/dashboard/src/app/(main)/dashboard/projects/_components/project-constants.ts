import { z } from "zod";

import type { Project } from "@/lib/types";

export const PROJECT_STATUSES = ["Active", "Completed", "Paused"] as const;

export const projectSchema = z.object({
  clientId: z.string().min(1, "Please select a parent client."),
  name: z.string().min(1, "Project title is required."),
  status: z.enum(PROJECT_STATUSES),
  budget: z.string(),
  address: z.string(),
  notes: z.string(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const EMPTY_PROJECT_FORM: ProjectFormData = {
  clientId: "",
  name: "",
  status: "Active",
  budget: "",
  address: "",
  notes: "",
};

/** Map an existing project onto the editable form shape. */
export function projectToForm(project: Project): ProjectFormData {
  return {
    clientId: project.clientId,
    name: project.name,
    status: project.status,
    budget: project.budget ?? "",
    address: project.address ?? "",
    notes: project.notes ?? "",
  };
}
