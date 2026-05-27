"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ProjectButton from "./ui/ProjectButton";
import ContactDrawerContent from "./ContactDrawerContent";

const LINKS = [
  { name: "Projects", href: "/projects" },
  { name: "About", href: "/about" },
  { name: "Press", href: "/press" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar2() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Return null if on studio route to avoid layout overlap in Sanity CMS
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      data-fixed=""
      className={cn(
        "fixed top-0 left-0 w-full z-50 text-white font-medium flex justify-center items-center transition-all duration-300 ease-in-out",
        isScrolled
          ? "h-20 shadow backdrop-blur-md bg-taupe-900/5"
          : "h-26 shadow-none backdrop-blur-none bg-transparent",
      )}
      style={{ viewTransitionName: "main-navbar" } as React.CSSProperties}>
      {/* Absolute background layer to smoothly fade the linear gradient without snapping */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-b from-taupe-900/90 to-taupe-800/80 transition-opacity duration-300 ease-in-out -z-10",
          isScrolled ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      <div className="flex-1 flex items-center justify-between px-4 md:px-6 max-w-[1800px] mx-auto">
        {/* Left: Logo (fixed width to balance layout) */}
        <div className="w-[200px] shrink-0">
          <Link href="/">
            <Image
              src="/assets/logo_sdg-horizontal.svg"
              alt="Sarvian Design Group"
              loading="eager"
              width={0}
              height={0}
              sizes="200px"
              className="brightness-0 invert"
              style={{
                width: "200px",
                height: "auto",
              }}
              priority
            />
          </Link>
        </div>

        {/* Center: Centered Navigation Links */}
        <ul className="flex items-center gap-10">
          {LINKS.map((link) => (
            <li key={link.href}>
              {link.name === "Contact" ? (
                <Drawer
                  direction="right"
                  duration={1000}
                  open={isDrawerOpen}
                  onOpenChange={setIsDrawerOpen}>
                  <DrawerTrigger asChild>
                    <button className="relative text-lg uppercase group py-1 tracking-wide cursor-pointer text-white font-medium hover:text-white/80 transition-colors bg-transparent border-none outline-none">
                      {link.name}
                      <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-white transition-all duration-300 -translate-x-1/2 group-hover:w-full" />
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-cream-200">
                    <ContactDrawerContent />
                  </DrawerContent>
                </Drawer>
              ) : (
                <Link
                  href={link.href}
                  className="relative text-lg uppercase group py-1 tracking-wide">
                  {link.name}
                  <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-white transition-all duration-300 -translate-x-1/2 group-hover:w-full" />
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Right: CTA Button (matching width of logo container for perfect centering) */}
        <div className="w-[200px] flex justify-end shrink-0">
          <ProjectButton
            location="navbar"
            className="bg-white text-foreground hover:bg-accent hover:text-white">
            Let's Talk
          </ProjectButton>
        </div>
      </div>
    </nav>
  );
}
