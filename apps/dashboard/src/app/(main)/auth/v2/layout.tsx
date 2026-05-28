import type { ReactNode } from "react";
import { APP_CONFIG } from "@/config/app-config";
import Image from "next/image";

export default function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full flex-col items-center justify-center rounded-3xl bg-primary lg:flex text-center">
          <div className="space-y-4 px-10 text-primary-foreground flex flex-col items-center">
            <Image
              src="/logo_sdg-S-only.svg"
              className="invert"
              alt="Logo"
              width={220}
              height={220}
            />
            <h1 className="font-medium text-3xl">{APP_CONFIG.name}</h1>
            <p className="text-sm opacity-90">Design. Build. Repeat.</p>
          </div>
        </div>
        <div className="relative order-1 flex h-full items-center justify-center">
          {children}
        </div>
      </div>
    </main>
  );
}
