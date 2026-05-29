"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export function UserGreeting({ prefix = "Hello" }: { prefix?: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setName(data.displayName || user.displayName || data.fullName || user.email?.split("@")[0] || "User");
          } else {
            setName(user.displayName || user.email?.split("@")[0] || "User");
          }
        } catch (error) {
          setName(user.displayName || user.email?.split("@")[0] || "User");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (name === null) return <Skeleton className="h-9 w-48 inline-block" />;
  return <>{prefix}, {name}</>;
}
