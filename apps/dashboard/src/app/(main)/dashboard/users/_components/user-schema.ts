import { z } from "zod";

export const addUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "Please enter a full name.")
    .max(100, "Name is too long."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["Admin", "Contributor"]),
});

export type AddUserFormData = z.infer<typeof addUserSchema>;
