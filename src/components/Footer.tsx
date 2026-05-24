"use client";

import Image from "next/image";
import Button from "./ui/Button";
import Container from "./ui/Container";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <footer className="w-full relative bg-[linear-gradient(180deg,hsl(32,15,15)_0%,hsl(32,15,10)_90%)]">
      <Container className="relative">
        <div className="mx-auto py-12">
          <Image
            className="mx-auto brightness-0 invert"
            src="/logo.png"
            alt="Sarvian Design Group"
            width={0}
            height={0}
            sizes="200px"
            quality={90}
            style={{ width: "200px", height: "auto" }}
          />
          <p className="mt-3 text-sm text-white text-center">
            Architecture and interior design firm.
          </p>
        </div>
        <div className="relative h-px w-full">
          <div className="absolute left-0 right-0 top-0 h-px bg-ink-900" />
          <div className="absolute left-0 right-0 top-px h-px bg-white/5" />
        </div>
        <div className="py-4 text-[0.9rem] mx-auto w-full flex justify-between">
          <p className="text-sand-300 text-sm">
            © {new Date().getFullYear()} Sarvian Design Group. All rights
            reserved.
          </p>
          <p className="text-sand-300 text-sm">
            Made by{" "}
            <a
              className="text-sand-300"
              href="https://www.lenisvisuals.com"
              target="_blank"
              rel="noopener noreferrer">
              LENIS VISUALS
            </a>
          </p>
        </div>
      </Container>
      <div
        className="absolute top-1/2 -translate-y-1/2 right-30 opacity-50 pointer-events-none z-0"
        style={{
          width: "300px",
          height: "300px",
          background:
            "linear-gradient(to bottom, var(--taupe-800), var(--ink-900))",
          maskImage: "url(/assets/logo_sdg-S-only.svg)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: "url(/assets/logo_sdg-S-only.svg)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 left-30 opacity-50 pointer-events-none z-0"
        style={{
          width: "300px",
          height: "300px",
          background:
            "linear-gradient(to bottom, var(--taupe-800), var(--ink-900))",
          maskImage: "url(/assets/logo_sdg-S-only.svg)",
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: "url(/assets/logo_sdg-S-only.svg)",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
    </footer>
  );
}
