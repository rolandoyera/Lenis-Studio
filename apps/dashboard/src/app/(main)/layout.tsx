import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth-context";
import { AuthGuard } from "@/components/auth-guard";

export default function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
