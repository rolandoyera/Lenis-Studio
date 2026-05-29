import type { ReactNode } from "react";
import { APP_CONFIG } from "@/config/app-config";
import Image from "next/image";

export default function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full flex-col items-center justify-center rounded-3xl overflow-hidden lg:flex text-center shadow-lg">
          {/* Blurred Background Image with scale to prevent edge bleeding */}
          <Image
            src="/sarvian-design-group.jpg"
            alt="Sarvian Design Group"
            fill
            priority
            className="object-cover select-none pointer-events-none blur-[2px] scale-105"
          />
          {/* Dark Overlay for premium high contrast */}
          <div className="absolute inset-0 bg-black/60 z-0" />

          {/* Branding Content on top */}
          <div className="relative z-10 space-y-4 px-10 text-white flex flex-col items-center">
            <Image
              src="/logo_sdg-S-only.svg"
              className="invert drop-shadow-sm"
              alt="Logo"
              width={220}
              height={220}
            />
            <h1 className="font-semibold text-4xl tracking-tight drop-shadow-md">
              {APP_CONFIG.name}
            </h1>
            <p className="text-sm font-medium tracking-wide text-white/80 drop-shadow-sm">
              Design. Build. Repeat.
            </p>
          </div>
        </div>
        <div className="relative order-1 flex h-full items-center justify-center">
          {children}
        </div>
      </div>
    </main>
  );
}
