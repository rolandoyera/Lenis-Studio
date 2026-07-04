import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Effect-churn guardrail (template: clients/page.test.tsx): the bell's
// listener must key on stable primitives from useAuth (organizationId, uid,
// loading), NOT the profile object — profile identity changes on every
// onSnapshot heartbeat, and an effect keyed on it would tear down and
// resubscribe the notifications listener each time.

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(),
  where: vi.fn(),
}));
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("@/lib/db", () => ({
  dismissNotification: vi.fn(),
  markNotificationRead: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/auth-context", () => ({
  useAuth: () => authState,
}));

import { onSnapshot } from "firebase/firestore";

import type { UserProfile } from "@/lib/types";

import { NotificationBell } from "./notification-bell";

function makeProfile(): UserProfile {
  return {
    uid: "user-1",
    fullName: "Test User",
    email: "test@example.com",
    role: "Contributor",
    organizationId: "org1",
    status: "Active",
    joinedDate: "2026-01-01",
    lastActive: Date.now(),
  } as UserProfile;
}

let authState: {
  user: unknown;
  profile: UserProfile | null;
  organizationId: string | null;
  uid: string | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

beforeEach(() => {
  vi.clearAllMocks();
  authState = {
    user: {},
    profile: makeProfile(),
    organizationId: "org1",
    uid: "user-1",
    role: "Contributor",
    loading: false,
    signOut: () => Promise.resolve(),
  };
});

afterEach(cleanup);

describe("notification bell listener effect", () => {
  it("subscribes once — a profile heartbeat must not resubscribe", () => {
    const { rerender } = render(<NotificationBell />);
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    // Simulate the auth onSnapshot heartbeat: same values, new object identity.
    authState = { ...authState, profile: makeProfile() };
    rerender(<NotificationBell />);

    expect(onSnapshot).toHaveBeenCalledTimes(1);
  });

  it("resubscribes when the organization actually changes", () => {
    const { rerender } = render(<NotificationBell />);
    expect(onSnapshot).toHaveBeenCalledTimes(1);

    authState = { ...authState, organizationId: "org2" };
    rerender(<NotificationBell />);

    expect(onSnapshot).toHaveBeenCalledTimes(2);
  });

  it("does not subscribe while auth is still loading", () => {
    authState = {
      ...authState,
      loading: true,
      organizationId: null,
      uid: null,
    };
    render(<NotificationBell />);

    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
