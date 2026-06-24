import type { ReactNode } from "react";

import { ViewTransition } from "react";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { getRequestAppBrand } from "@/server/app-brand";

import { AuthBackdrop } from "./_components/auth-backdrop";

export default async function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const brand = await getRequestAppBrand();

  return (
    <main className="bg-sidebar">
      <div className="relative grid h-dvh justify-center overflow-hidden p-2 lg:grid-cols-2">
        {/* Image, left column. Shares `auth-image` with the home screen so it slides
            in from the right during the home -> login transition. */}
        <ViewTransition name="auth-image">
          <div className="relative order-1 hidden h-full overflow-hidden rounded-3xl shadow-lg lg:block">
            <AuthBackdrop overlayClassName="bg-black/60" />
          </div>
        </ViewTransition>

        {/* Brand, pinned over the left half. Shares `auth-brand` with home: it stays in
            place and recolors to white as the image arrives behind it. */}
        <ViewTransition name="auth-brand">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-1/2 flex-col items-center justify-center px-10 text-center text-white lg:flex">
            <div className="size-44 mb-8">
              <Image
                src={brand.image.darkSrc}
                className={cn(
                  "drop-shadow-sm",
                  brand.image.invertOnDark && "invert",
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
            <p className="font-light text-base text-white tracking-widest drop-shadow-sm">
              {brand.tagline}
            </p>
          </div>
        </ViewTransition>

        {/* Form, right column. Slides up on mount (`auth-form-enter`) so it animates on a
            direct visit too, not only when arriving via the home -> login transition. */}
        <div className="auth-form-enter relative order-2 flex h-full items-center justify-center">
          {children}
        </div>
      </div>
    </main>
  );
}
