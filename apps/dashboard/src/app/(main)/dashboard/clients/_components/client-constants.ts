import { z } from "zod";

import { isValidUsPhone } from "@/lib/utils";

export const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.union([z.string().email("Please enter a valid email address."), z.literal("")]),
  phone: z.string().refine(isValidUsPhone, "Enter a valid 10-digit US phone number."),
  company: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  notes: z.string(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const EMPTY_CLIENT_FORM: ClientFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  notes: "",
};
