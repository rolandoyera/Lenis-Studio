import { describe, expect, it } from "vitest";

import type { Project } from "@/lib/types";

import {
  isProjectTab,
  projectSchema,
  projectToForm,
} from "./project-constants";

describe("project schema and helpers", () => {
  it("recognizes valid project tabs only", () => {
    expect(isProjectTab("overview")).toBe(true);
    expect(isProjectTab("unknown")).toBe(false);
    expect(isProjectTab(null)).toBe(false);
  });

  it("validates project form data", () => {
    const valid = {
      clientId: "client-1",
      name: "Project",
      status: "in_progress",
      budget: 1000,
      sameAsMain: false,
      street: "",
      city: "",
      state: "",
      zip: "33101",
      country: "US",
      brief: "",
    };

    expect(projectSchema.safeParse(valid).success).toBe(true);
    expect(projectSchema.safeParse({ ...valid, clientId: "" }).success).toBe(
      false,
    );
    expect(projectSchema.safeParse({ ...valid, zip: "3310" }).success).toBe(
      false,
    );
  });

  it("maps existing project values into editable form shape", () => {
    const project: Project = {
      projectId: "project-1",
      organizationId: "org-1",
      clientId: "client-1",
      name: "Project",
      address: "Legacy address",
      status: "completed",
      budget: 5000,
      createdBy: "user-1",
      updatedBy: "user-1",
      createdAt: 1,
      updatedAt: 1,
    };

    expect(projectToForm(project)).toMatchObject({
      street: "Legacy address",
      status: "completed",
      budget: 5000,
      country: "US",
    });
  });
});
