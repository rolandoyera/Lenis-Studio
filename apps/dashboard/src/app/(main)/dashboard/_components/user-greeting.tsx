"use client";

import { useAuth } from "@/components/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function UserGreeting({ prefix = "Hello" }: { prefix?: string }) {
  const { profile, loading } = useAuth();

  if (loading || !profile) return <Skeleton className="inline-block h-9 w-48" />;

  const name = profile.displayName || profile.fullName || "User";

  return (
    <>
      {prefix}, {name}
    </>
  );
}
