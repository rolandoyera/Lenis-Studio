// Shared between the client auth context (which writes the cookie on login)
// and server actions (which read it to resolve the tenant's configuration).
export const ACTIVE_ORG_COOKIE = "active-organization-id";
