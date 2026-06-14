import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The blurred photo + dark overlay shared by the home and login screens.
 * Rendered identically on both so the View Transition morph stays clean; only the
 * overlay darkness differs (lighter on home, darker behind the login text).
 */
export function AuthBackdrop({ overlayClassName }: { overlayClassName?: string }) {
  return (
    <>
      <Image
        src="/sarvian-design-group.jpg"
        alt="Lenis Studio Image"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="pointer-events-none scale-105 select-none object-cover blur-[2px]"
      />
      <div className={cn("absolute inset-0 z-0 bg-black/60", overlayClassName)} />
    </>
  );
}
