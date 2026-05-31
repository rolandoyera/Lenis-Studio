"use client";

import { type ReactNode, useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { format } from "date-fns";
import { onAuthStateChanged, type User } from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = pathname.startsWith("/auth");
  const isInviteRoute = pathname.startsWith("/auth/invite");

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isInviteRoute) {
        setUser(firebaseUser);
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            // Document for UID does not exist. Check if we have an invitation pending under the user's email.
            const emailKey = firebaseUser.email ? firebaseUser.email.trim().toLowerCase() : "";
            if (emailKey) {
              const pendingDocRef = doc(db, "users", emailKey);
              const pendingDocSnap = await getDoc(pendingDocRef);

              if (pendingDocSnap.exists()) {
                const pendingData = pendingDocSnap.data();
                // 1. Write the new document using their UID as the key
                await setDoc(userDocRef, {
                  fullName: pendingData.fullName || firebaseUser.displayName || "User",
                  email: emailKey,
                  role: pendingData.role || "Contributor",
                  status: "Active",
                  joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
                  lastActive: Date.now(),
                });
                // 2. Delete the temporary email-keyed invitation document
                await deleteDoc(pendingDocRef);
              } else {
                // No pending invitation, create a default active contributor document
                await setDoc(userDocRef, {
                  fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
                  email: emailKey,
                  role: "Contributor",
                  status: "Active",
                  joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
                  lastActive: Date.now(),
                });
              }
            }
          } else {
            // UID document exists. If status is "Pending", promote it to "Active"
            const currentData = userDocSnap.data();
            if (currentData.status === "Pending") {
              await setDoc(
                userDocRef,
                {
                  status: "Active",
                  lastActive: Date.now(),
                },
                { merge: true },
              );
            }
          }
        } catch (error) {
          console.error("Error in AuthGuard session initialization:", error);
        }
      }

      setUser(firebaseUser);
      setLoading(false);

      // If not logged in and trying to access a protected route, redirect to login
      if (!firebaseUser && !isAuthRoute) {
        router.push("/auth/login");
      }
      // If logged in and trying to access login/recovery routes, redirect to dashboard
      else if (firebaseUser && isAuthRoute) {
        router.push("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [isAuthRoute, isInviteRoute, router]);

  // Keep user active in Firestore on page navigation
  useEffect(() => {
    if (!user) return;
    const updateActiveStatus = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { lastActive: Date.now() }, { merge: true });
      } catch (error) {
        console.error("Error updating active status:", error);
      }
    };
    updateActiveStatus();
  }, [pathname, user]);

  // Render children immediately for auth routes (like login, forgot-password)
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If checking authentication state, display an premium, elegant loader
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="relative flex flex-col items-center gap-4">
          {/* Elegant Pulsating Double Ring Spinner */}
          <div className="relative size-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-primary/40 border-b-transparent animate-spin animation-duration-[1.5s] direction-[reverse]" />
          </div>
          {/* Subtly fading loader label */}
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase animate-pulse">
            Verifying Session
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the dashboard content safely
  if (user) {
    return <>{children}</>;
  }

  // Safe fallback while redirect is executing
  return <div className="flex h-screen w-screen items-center justify-center bg-background" />;
}
