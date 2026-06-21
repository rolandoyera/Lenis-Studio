"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { deleteClientCookie, setClientCookie } from "@/lib/cookie.client";
import { auth, db } from "@/lib/firebase";
import { ACTIVE_ORG_COOKIE } from "@/lib/org-cookie";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  /**
   * Stable primitive projections of `profile`. Prefer these in effect dependency
   * arrays: unlike the `profile` object (whose identity changes on every profile
   * onSnapshot/lastActive update), these only change when their value changes, so
   * an effect keyed on `organizationId` won't refetch on each heartbeat.
   */
  organizationId: string | null;
  uid: string | null;
  role: UserProfile["role"] | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous profile listener if any
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Set up real-time listener for user profile document
        const profileRef = doc(db, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          profileRef,
          (snapshot) => {
            const data = snapshot.data();
            if (snapshot.exists() && data?.organizationId) {
              setProfile({
                uid: firebaseUser.uid,
                fullName: data.fullName || "User",
                displayName: data.displayName,
                email: data.email || firebaseUser.email || "",
                role: data.role || "Contributor",
                organizationId: data.organizationId,
                status: data.status || "Active",
                joinedDate: data.joinedDate || "",
                lastActive: data.lastActive || 0,
                location: data.location,
                phone: data.phone,
              });
              setClientCookie(ACTIVE_ORG_COOKIE, data.organizationId, 30);
              setLoading(false);
              return;
            }

            // A snapshot with pending local writes is an optimistic echo of our
            // own merge write (e.g. AuthGuard's lastActive update) that fires
            // before the full server document has loaded. It can be missing
            // fields like organizationId, so it must never drive the
            // authorization verdict — wait for the server-confirmed snapshot.
            if (snapshot.metadata.hasPendingWrites) return;

            // Access is invite-only: a server-confirmed profile without an
            // organization is invalid and must never inherit another tenant's context.
            if (snapshot.exists()) {
              console.error(
                "User profile is missing organizationId; treating session as unauthorized.",
              );
            }
            setProfile(null);
            deleteClientCookie(ACTIVE_ORG_COOKIE);
            setLoading(false);
          },
          (error) => {
            // permission-denied is expected as listeners tear down during sign-out;
            // the auth token is already gone, so it is not a real error.
            if ((error as { code?: string }).code !== "permission-denied") {
              console.error("Error listening to user profile:", error);
            }
            setLoading(false);
          },
        );
      } else {
        setProfile(null);
        deleteClientCookie(ACTIVE_ORG_COOKIE);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organizationId: profile?.organizationId ?? null,
        uid: profile?.uid ?? null,
        role: profile?.role ?? null,
        loading,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
