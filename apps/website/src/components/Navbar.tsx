"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLenis } from "lenis/react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import ProjectButton from "./ui/ProjectButton";
import ContactDrawerContent from "./ContactDrawerContent";

const LINKS = [
  { name: "Projects", href: "/projects" },
  { name: "About", href: "/about" },
  { name: "Press", href: "/press" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const lenis = useLenis();
  const [isScrolled, setIsScrolled] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    if (!isMobileMenuOpen) {
      lenis?.start();
      return;
    }

    lenis?.stop();
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      lenis?.start();
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isMobileMenuOpen, lenis]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Return null if on studio route to avoid layout overlap in Sanity CMS
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <Drawer
      direction="right"
      duration={1000}
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}>
      <nav
        aria-label="Primary"
        data-fixed=""
        className={cn(
          "fixed top-0 left-0 w-full z-50 text-white font-medium flex justify-center items-center transition-all duration-300 ease-in-out",
          isScrolled
            ? "h-20 shadow backdrop-blur-md bg-taupe-900/5"
            : "h-26 shadow-none backdrop-blur-none bg-transparent",
        )}
        style={
          {
            viewTransitionName: "main-navbar",
            "--mobile-nav-height": isScrolled ? "5rem" : "6.5rem",
          } as React.CSSProperties & Record<"--mobile-nav-height", string>
        }>
        {/* Absolute background layer to smoothly fade the linear gradient without snapping */}
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-b from-taupe-900/90 to-taupe-800/80 transition-opacity duration-300 ease-in-out -z-10",
            isScrolled || isMobileMenuOpen
              ? "opacity-100"
              : "opacity-0 pointer-events-none",
          )}
        />

        <div className="relative z-20 flex-1 flex items-center justify-between px-4 md:px-6 max-w-[1800px] mx-auto">
          {/* Left: Logo (fixed width to balance layout) */}
          <div className="w-[180px] lg:w-[200px] shrink-0">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Image
                src="/assets/logo_sdg-horizontal.svg"
                alt="Sarvian Design Group"
                loading="eager"
                width={0}
                height={0}
                sizes="(max-width: 1024px) 180px, 200px"
                className="brightness-0 invert"
                style={{
                  width: "100%",
                  height: "auto",
                }}
                priority
              />
            </Link>
          </div>

          {/* Center: Centered Navigation Links */}
          <ul className="hidden lg:flex items-center gap-10">
            {LINKS.map((link) => (
              <li key={link.href}>
                {link.name === "Contact" ? (
                  <DrawerTrigger asChild>
                    <button className="relative text-lg uppercase group py-1 tracking-wide cursor-pointer text-white font-medium hover:text-white/80 transition-colors bg-transparent border-none outline-none">
                      {link.name}
                      <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-white transition-all duration-300 -translate-x-1/2 group-hover:w-full" />
                    </button>
                  </DrawerTrigger>
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
          <div className="hidden lg:flex w-[200px] justify-end shrink-0">
            <ProjectButton
              location="navbar"
              className="bg-white text-foreground hover:bg-accent hover:text-white">
              Let's Talk
            </ProjectButton>
          </div>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="lg:hidden inline-flex size-11 items-center justify-center rounded text-white">
            {isMobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "lg:hidden fixed inset-0 z-10 bg-taupe-900/25 transition-opacity duration-300 [backdrop-filter:blur(18px)] [-webkit-backdrop-filter:blur(18px)]",
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          )}
        />

        <div
          className={cn(
            "lg:hidden absolute inset-x-0 top-full z-20 h-[calc(100dvh-var(--mobile-nav-height))] overflow-y-auto bg-taupe-900 transition-all duration-300 ease-in-out [backdrop-filter:blur(18px)] [-webkit-backdrop-filter:blur(18px)]",
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none -translate-y-4",
          )}>
          <div className="flex min-h-full flex-col px-6 py-8">
            <ul className="flex flex-col gap-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  {link.name === "Contact" ? (
                    <DrawerTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex w-full items-center justify-between border-b border-white/15 py-5 text-left text-2xl uppercase tracking-wide text-white transition-colors hover:text-white/80">
                        {link.name}
                      </button>
                    </DrawerTrigger>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between border-b border-white/15 py-5 text-2xl uppercase tracking-wide text-white transition-colors hover:text-white/80">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div
              className="mt-50 pt-8"
              onClick={() => setIsMobileMenuOpen(false)}>
              <ProjectButton
                location="mobile_navbar"
                className="w-full justify-between bg-white text-foreground hover:bg-accent hover:text-white">
                Let's Talk
              </ProjectButton>
            </div>
          </div>
        </div>
      </nav>
      <DrawerContent className="bg-cream-200">
        <ContactDrawerContent />
      </DrawerContent>
    </Drawer>
  );
}
