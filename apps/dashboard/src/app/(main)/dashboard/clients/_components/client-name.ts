import type { Client } from "@/lib/types";

/** A client's first and last name, trimmed. */
export function getClientName(client: Client): {
  firstName: string;
  lastName: string;
} {
  return {
    firstName: client.firstName?.trim() ?? "",
    lastName: client.lastName?.trim() ?? "",
  };
}
