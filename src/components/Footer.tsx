"use client";

import Image from "next/image";
import Container from "./ui/Container";
import { usePathname } from "next/navigation";
import InstagramIcon from "./icons/InstagramIcon";
import MailIcon from "./icons/MailIcon";
import WhatsAppIcon from "./icons/WhatsAppIcon";
import WatermarkLogo from "./WatermarkLogo";

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <footer className="w-full relative bg-linear-to-b from-taupe-800 to-taupe-900 h-100 overflow-hidden">
      <Container className="relative flex flex-col h-full items-center justify-center max-w-[900px] z-10">
        <div className="flex-1 flex flex-col items-center justify-center">
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
          <p className="mt-3 text-sm text-cream-300 text-center">
            Architecture and interior design firm.
          </p>
          <div className="flex justify-center items-center gap-10 mt-4">
            <a
              href="https://www.instagram.com/sarviandesigngroup/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram (opens in a new tab)"
              className="text-cream-300 flex items-center justify-center w-[30px] h-[30px]">
              <InstagramIcon size={30} color="currentColor" />
            </a>
            <a
              href="mailto:osh@sarviandg.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Send email to osh@sarviandg.com (opens in a new tab)"
              className="text-cream-300 flex items-center justify-center w-[32px] h-[32px]">
              <MailIcon size={32} color="currentColor" />
            </a>
            <a
              href="https://wa.me/16466394147"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp with +1 (646) 639-4147 (opens in a new tab)"
              className="text-cream-300 flex items-center justify-center w-[30px] h-[30px]">
              <WhatsAppIcon size={26} color="currentColor" />
            </a>
          </div>
        </div>

        <div className="relative h-px w-full">
          <div className="absolute left-0 right-0 top-0 h-px bg-black/80" />
          <div className="absolute left-0 right-0 top-px h-px bg-white/15" />
        </div>
        <div className="py-4 text-[0.9rem] mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
          <p className="text-cream-300 text-sm">
            © {new Date().getFullYear()} Sarvian Design Group. All rights
            reserved.
          </p>
          <p className="text-cream-300 text-sm">
            Made with ❤️ by{" "}
            <a
              className="text-cream-300 hover:text-accent hover:underline"
              href="https://www.lenisvisuals.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LENIS VISUALS website (opens in a new tab)">
              LENIS VISUALS
            </a>
          </p>
        </div>
      </Container>
      <WatermarkLogo
        className="top-1/2 -translate-y-1/2 left-[12%] hidden lg:block"
        rotation={-20}
        size={500}
      />
    </footer>
  );
}
