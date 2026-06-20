import type { ReactNode } from "react";

// Reports render outside the dashboard shell (no sidebar/header) so they print
// cleanly. Auth still applies via the parent (main) layout's AuthGuard.
import "@/styles/report.css";

export default function ReportsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
