"use client";
import ContactModalProvider from "@/components/ProjectModalProvider";
import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith("/studio");

  const content = <ContactModalProvider>{children}</ContactModalProvider>;

  if (isStudio) {
    return content;
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, syncTouch: true }}>
      {content}
    </ReactLenis>
  );
}
