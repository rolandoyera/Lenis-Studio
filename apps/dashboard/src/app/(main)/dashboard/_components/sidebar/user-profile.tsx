"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { format } from "date-fns";

import { BadgeCheck, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export function UserProfile({
  users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
  }>;
}) {
  const [activeUser, setActiveUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          let fullName =
            fbUser.displayName || fbUser.email?.split("@")[0] || "User";
          let role = "Contributor";

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            fullName = data.fullName || fullName;
            role = data.role || role;
          } else {
            // Auto-provision default Firestore user doc!
            try {
              await setDoc(userDocRef, {
                fullName: fullName,
                role: role,
                email: fbUser.email || "",
                updatedAt: new Date().toISOString(),
                joinedDate: format(new Date(), "dd MMM yyyy, h:mm a"),
                status: "Active",
                lastActive: 0,
              });
            } catch (err) {
              console.error("Auto-provision document write error:", err);
            }
          }

          setActiveUser({
            id: fbUser.uid,
            name: fullName,
            email: fbUser.email || "",
            avatar: fbUser.photoURL || "",
            role: role,
          });
        } catch (error) {
          console.error("Switcher error:", error);
          setActiveUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
            email: fbUser.email || "",
            avatar: fbUser.photoURL || "",
            role: "Contributor",
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!activeUser) {
    return (
      <div className="size-8 rounded-lg bg-muted/60 animate-pulse border border-border/20" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="hover:cursor-pointer">
        <Avatar className="size-9 rounded-lg">
          <AvatarImage
            src={activeUser.avatar || undefined}
            alt={activeUser.name}
          />
          <AvatarFallback>{getInitials(activeUser.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 space-y-1 rounded-lg mt-2"
        side="bottom"
        align="end"
        sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile" className="hover:cursor-pointer">
              <BadgeCheck />
              Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
