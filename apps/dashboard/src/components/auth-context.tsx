"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { signOut as firebaseSignOut, onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { deleteClientCookie, setClientCookie } from "@/lib/cookie.client";
import { auth, db } from "@/lib/firebase";
import { ACTIVE_ORG_COOKIE } from "@/lib/org-cookie";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
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
            if (snapshot.exists()) {
              const data = snapshot.data();
              setProfile({
                uid: firebaseUser.uid,
                fullName: data.fullName || "User",
                displayName: data.displayName,
                email: data.email || firebaseUser.email || "",
                role: data.role || "Contributor",
                organizationId: data.organizationId || "org-demo", // fallback to demo for safety
                status: data.status || "Active",
                joinedDate: data.joinedDate || "",
                lastActive: data.lastActive || 0,
                location: data.location,
                phone: data.phone,
              });
              // Only the real org id may drive server-side tenant resolution —
              // a profile missing its organizationId must not inherit another tenant's config.
              if (data.organizationId) {
                setClientCookie(ACTIVE_ORG_COOKIE, data.organizationId, 30);
              } else {
                deleteClientCookie(ACTIVE_ORG_COOKIE);
              }
            } else {
              setProfile(null);
              deleteClientCookie(ACTIVE_ORG_COOKIE);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error listening to user profile:", error);
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

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
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
