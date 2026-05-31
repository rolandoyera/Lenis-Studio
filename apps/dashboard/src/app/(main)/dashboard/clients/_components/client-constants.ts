export type ClientFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

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

export function formatPhoneNumber(value: string): string {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";

  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  const tail = cleaned.length - 10;
  return `+${cleaned.slice(0, tail)} (${cleaned.slice(tail, tail + 3)}) ${cleaned.slice(tail + 3, tail + 6)}-${cleaned.slice(tail + 6)}`;
}
