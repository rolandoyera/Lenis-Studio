import z from "zod";

export const opportunitySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  referrer: z.string(),
  stage: z.string(),
  priority: z.number(),
  projectType: z.string(),
  value: z.string(),
});

export const opportunitiesSchema = z.array(opportunitySchema);

export type OpportunityRow = z.infer<typeof opportunitySchema>;
