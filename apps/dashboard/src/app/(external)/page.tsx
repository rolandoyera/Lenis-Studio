import { ViewTransition } from "react";

import Image from "next/image";
import Link from "next/link";

import { AuthBackdrop } from "@/app/(main)/auth/_components/auth-backdrop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRequestAppBrand } from "@/server/app-brand";

export default async function Home() {
  const brand = await getRequestAppBrand();

  return (
    <main className="bg-sidebar">
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        {/* Left: brand + login button. Brand is dark on light backgrounds and shares
            `auth-brand` with the login screen so it stays pinned (recoloring to white)
            once the image slides in behind it. */}
        <div className="relative order-1 h-full">
          <ViewTransition name="auth-brand">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-10 text-center text-foreground">
              <div className="size-44 mb-8">
                <Image
                  src={brand.image.src}
                  className={cn(
                    "drop-shadow-sm dark:hidden",
                    brand.image.invertOnDark && "dark:invert",
                  )}
                  alt={`${brand.name} logo`}
                  width={180}
                  height={180}
                  style={{ width: "auto", height: "auto" }}
                  priority
                />
                <Image
                  src={brand.image.darkSrc}
                  className={cn(
                    "hidden drop-shadow-sm dark:block",
                    brand.image.invertOnDark && "dark:invert",
                  )}
                  alt={`${brand.name} logo`}
                  width={180}
                  height={180}
                  style={{ width: "auto", height: "auto" }}
                  priority
                />
              </div>
              <h1 className="font-medium text-5xl font-lora tracking-tight drop-shadow-md">
                {brand.name}
              </h1>
              <p className="font-light text-base text-foreground/80 tracking-widest drop-shadow-sm">
                {brand.tagline}
              </p>
            </div>
          </ViewTransition>
          <div className="absolute inset-x-0 bottom-84 z-10 flex justify-center">
            <Button asChild size="lg" className="px-10">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>

        {/* Right: the image. Shares `auth-image` with the login screen, so it slides
            across to the left when navigating to /auth/login. */}
        <ViewTransition name="auth-image">
          <div className="relative order-2 hidden h-full overflow-hidden rounded-3xl shadow-lg lg:block">
            <AuthBackdrop overlayClassName="bg-black/30" />
          </div>
        </ViewTransition>
      </div>
    </main>
  );
}
