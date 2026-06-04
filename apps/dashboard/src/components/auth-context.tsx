"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { signOut as firebaseSignOut, onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
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
            } else {
              setProfile(null);
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
