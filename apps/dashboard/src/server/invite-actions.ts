"use server";

import { format } from "date-fns";
import { headers } from "next/headers";

import type { Organization, UserProfile } from "@/lib/types";

import { getAdminAuth, getAdminDb } from "./firebase-admin";

type InviteRole = "Admin" | "Contributor";
type TenantPlan = "Starter" | "Pro" | "Enterprise";

interface InviteCaller {
  uid: string;
  email?: string;
  organizationId: string;
  role: "SuperAdmin" | "Admin" | "Contributor";
}

export interface InviteUserInput {
  authToken: string;
  fullName: string;
  email: string;
  role: InviteRole;
}

export interface ResendInviteInput {
  authToken: string;
  email: string;
}

export interface CreateTenantInput {
  authToken: string;
  name: string;
  organizationId: string;
  adminName: string;
  adminEmail: string;
  plan: TenantPlan;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function requireCaller(authToken: string): Promise<InviteCaller> {
  const decoded = await getAdminAuth().verifyIdToken(authToken);
  const snap = await getAdminDb().doc(`users/${decoded.uid}`).get();
  if (!snap.exists) {
    throw new Error("User profile not found.");
  }

  const profile = snap.data() as UserProfile;
  if (
    profile.role !== "Admin" &&
    profile.role !== "SuperAdmin" &&
    profile.role !== "Contributor"
  ) {
    throw new Error("Invalid user role.");
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    organizationId: profile.organizationId,
    role: profile.role,
  };
}

function requireAdmin(caller: InviteCaller) {
  if (caller.role !== "Admin" && caller.role !== "SuperAdmin") {
    throw new Error("Administrator privileges required.");
  }
}

function requireSuperAdmin(caller: InviteCaller) {
  if (caller.role !== "SuperAdmin") {
    throw new Error("SuperAdmin privileges required.");
  }
}

function buildPendingUserInviteDoc(input: {
  fullName: string;
  email: string;
  role: InviteRole;
  organizationId: string;
}) {
  return {
    fullName: input.fullName.trim(),
    email: input.email,
    role: input.role,
    status: "Pending",
    joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
    lastActive: 0,
    organizationId: input.organizationId,
  };
}

function buildInviteMailDoc(input: {
  email: string;
  fullName: string;
  origin: string;
  subject?: string;
  intro?: string;
  buttonText?: string;
  footer?: string;
}) {
  const email = normalizeEmail(input.email);
  const fullName = escapeHtml(input.fullName.trim());

  return {
    to: email,
    message: {
      subject: input.subject ?? "You've been invited!",
      html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome, ${fullName}!</h2>
                <p style="color: #334155; font-size: 16px; line-height: 1.5;">
                  ${
                    input.intro ??
                    "You have been invited to join Sarvian Design Group CRM."
                  }
                </p>
                <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  Click the button below to sign in and activate your account:
                </p>
                <a href="${input.origin}/auth/invite?email=${email}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                  ${input.buttonText ?? "Set Up Account & Get Started"}
                </a>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 16px 0;" />
                <p style="color: #64748b; font-size: 12px; text-align: center;">
                  ${input.footer ?? "Sarvian Design Group CRM invitation. If you did not expect this, please ignore this email."}
                </p>
              </div>
            `,
    },
  };
}

async function assertNoActiveUserWithEmail(email: string) {
  const matches = await getAdminDb()
    .collection("users")
    .where("email", "==", email)
    .limit(2)
    .get();

  const activeMatch = matches.docs.find((doc) => {
    const data = doc.data() as Partial<UserProfile>;
    return doc.id !== email || data.status !== "Pending";
  });

  if (activeMatch) {
    throw new Error("A user with this email address already exists.");
  }
}

export async function inviteUser(input: InviteUserInput): Promise<void> {
  const caller = await requireCaller(input.authToken);
  requireAdmin(caller);

  const email = normalizeEmail(input.email);
  await assertNoActiveUserWithEmail(email);

  const db = getAdminDb();
  const pending = buildPendingUserInviteDoc({
    fullName: input.fullName,
    email,
    role: input.role,
    organizationId: caller.organizationId,
  });

  await db.doc(`users/${email}`).set(pending);
  await db.collection("mail").add(
    buildInviteMailDoc({
      email,
      fullName: pending.fullName,
      origin: await requestOrigin(),
    }),
  );
}

export async function resendInvite(input: ResendInviteInput): Promise<void> {
  const caller = await requireCaller(input.authToken);
  requireAdmin(caller);

  const email = normalizeEmail(input.email);
  const db = getAdminDb();
  const userRef = db.doc(`users/${email}`);
  const snap = await userRef.get();
  if (!snap.exists) throw new Error("Pending invite not found.");

  const invite = snap.data() as UserProfile;
  if (
    invite.status !== "Pending" ||
    invite.organizationId !== caller.organizationId
  ) {
    throw new Error("Pending invite not found.");
  }

  await userRef.set(
    { joinedDate: format(new Date(), "dd MMM yyyy, h:mm a") },
    { merge: true },
  );
  await db.collection("mail").add(
    buildInviteMailDoc({
      email,
      fullName: invite.fullName || invite.displayName || email,
      origin: await requestOrigin(),
    }),
  );
}

export async function createTenant(
  input: CreateTenantInput,
): Promise<Organization> {
  const caller = await requireCaller(input.authToken);
  requireSuperAdmin(caller);

  const organizationId = input.organizationId.trim().toLowerCase();
  const adminEmail = normalizeEmail(input.adminEmail);
  const db = getAdminDb();

  const orgRef = db.doc(`organizations/${organizationId}`);
  const existingOrg = await orgRef.get();
  if (existingOrg.exists) {
    throw new Error(`Organization ID '${organizationId}' is already taken.`);
  }

  await assertNoActiveUserWithEmail(adminEmail);

  const org: Organization = {
    organizationId,
    name: input.name.trim(),
    adminEmail,
    plan: input.plan,
    status: "Active",
    createdAt: Date.now(),
  };
  const pending = buildPendingUserInviteDoc({
    fullName: input.adminName,
    email: adminEmail,
    role: "Admin",
    organizationId,
  });

  const batch = db.batch();
  batch.set(orgRef, org);
  batch.set(db.doc(`users/${adminEmail}`), pending);
  await batch.commit();

  await db.collection("mail").add(
    buildInviteMailDoc({
      email: adminEmail,
      fullName: pending.fullName,
      origin: await requestOrigin(),
      subject: `Welcome to SDG CRM - Set up your studio, ${pending.fullName}!`,
      intro: `You have been invited to set up your design studio, <strong>${escapeHtml(org.name)}</strong>, on the Sarvian Design Group CRM platform.`,
      buttonText: "Activate Administrator Account",
      footer:
        "Tenant onboarding invitation. If you did not expect this, please ignore this email.",
    }),
  );

  return org;
}
