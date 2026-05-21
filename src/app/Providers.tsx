"use client";
import ContactModalProvider from "@/components/ContactModalProvider";
import { ThemeProvider } from "next-themes";
import { ReactLenis } from "lenis/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ReactLenis root options={{ lerp: 0.1, duration: 1.5, syncTouch: true }}>
        <ContactModalProvider>{children}</ContactModalProvider>
      </ReactLenis>
    </ThemeProvider>
  );
}
