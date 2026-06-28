import { z } from "zod";

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter an organization name (min 2 characters).")
    .max(100),
  organizationId: z
    .string()
    .min(3, "Organization ID must be at least 3 characters.")
    .max(30)
    .regex(
      /^[a-z0-9-]+$/,
      "ID can only contain lowercase letters, numbers, and hyphens (no spaces).",
    ),
  adminName: z
    .string()
    .min(2, "Please enter the admin's full name.")
    .max(100)
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2,
      "Please enter both first and last name.",
    ),
  adminEmail: z.string().email("Please enter a valid email address."),
  plan: z.enum(["Starter", "Pro", "Enterprise"]),
});

export type CreateTenantFormData = z.infer<typeof createTenantSchema>;
