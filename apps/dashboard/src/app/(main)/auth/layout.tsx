import type { ReactNode } from "react";

import Image from "next/image";

import { APP_CONFIG } from "@/config/app-config";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="bg-sidebar">
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full flex-col items-center justify-center overflow-hidden rounded-3xl text-center shadow-lg lg:flex">
          {/* Blurred Background Image with scale to prevent edge bleeding */}
          <Image
            src="/sarvian-design-group.jpg"
            alt="Lenis Studio"
            fill
            priority
            className="pointer-events-none scale-105 select-none object-cover blur-[2px]"
          />
          {/* Dark Overlay for premium high contrast */}
          <div className="absolute inset-0 z-0 bg-black/60" />

          {/* Branding Content on top */}
          <div className="relative z-10 flex flex-col items-center space-y-4 px-10 text-white">
            <Image src={APP_CONFIG.image.src} className="drop-shadow-sm invert" alt="Logo" width={220} height={220} />
            <h1 className="font-medium text-5xl font-serif tracking-tight drop-shadow-md">{APP_CONFIG.name}</h1>
            <p className="font-light text-sm text-white tracking-widest drop-shadow-sm">Design. Build. Repeat.</p>
          </div>
        </div>
        <div className="relative order-1 flex h-full items-center justify-center">{children}</div>
      </div>
    </main>
  );
}
