import { format } from "date-fns";

import type { UserProfile } from "@/lib/types";

import type { AddUserFormData } from "./user-schema";

export function buildPendingUserInviteDoc(
  data: AddUserFormData,
  organizationId: string,
): Omit<UserProfile, "uid" | "displayName" | "location" | "phone"> {
  const trimmedEmail = data.email.trim().toLowerCase();

  return {
    fullName: data.fullName.trim(),
    email: trimmedEmail,
    role: data.role,
    status: "Pending",
    joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
    lastActive: 0,
    organizationId,
  };
}

export function buildInviteMailDoc(input: {
  email: string;
  fullName: string;
  origin: string;
}) {
  const email = input.email.trim().toLowerCase();

  return {
    to: email,
    message: {
      subject: "You've been invited!",
      html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome, ${input.fullName.trim()}!</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.5;">
                  You have been invited to join Sarvian Design Group CRM.
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  Click the button below to sign in and activate your account:
                </p>
                <a href="${input.origin}/auth/invite?email=${email}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  Set Up Account & Get Started
                </a>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                  Sarvian Design Group CRM invitation. If you did not expect this, please ignore this email.
                </p>
              </div>
            `,
    },
  };
}
