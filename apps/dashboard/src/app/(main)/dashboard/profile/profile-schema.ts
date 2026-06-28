import { z } from "zod";

import { isValidUsPhone, isValidUsZip } from "@/lib/utils";

export const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required."),
  fullName: z.string().min(1, "Full name is required."),
  role: z.string().min(1, "Role is required."),
  phone: z.union([
    z
      .string()
      .refine(isValidUsPhone, "Enter a valid 10-digit US phone number."),
    z.literal(""),
  ]),
  location: z.union([
    z.string().refine(isValidUsZip, "Enter a valid 5-digit ZIP code."),
    z.literal(""),
  ]),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
