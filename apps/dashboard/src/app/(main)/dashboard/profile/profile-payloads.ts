import { format } from "date-fns";

import type { ProfileFormData } from "./profile-schema";

export function buildProfileSavePayload(data: ProfileFormData, email: string) {
  return {
    fullName: data.fullName,
    displayName: data.displayName,
    role: data.role,
    phone: data.phone,
    location: data.location,
    email,
    updatedAt: new Date().toISOString(),
  };
}

export function buildResendInviteUserPatch() {
  return {
    joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
  };
}
