import type { ReactNode } from "react";

import { AuthGuard } from "@/components/auth-guard";

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthGuard>{children}</AuthGuard>;
}
