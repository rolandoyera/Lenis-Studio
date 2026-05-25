"use client";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Container from "./ui/Container";
import { usePathname } from "next/navigation";

const BASE_DESKTOP_CLASS =
  "relative p-2 tracking-tight uppercase after:absolute after:h-[2px] after:bottom-[4px] after:left-2 after:right-2 after:w-[calc(100%-16px)] after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-200 hover:after:scale-x-100 text-xl";

const LEFT_LINKS = [
  { name: "Projects", href: "/projects" },
  { name: "Press", href: "/press" },
];

const RIGHT_LINKS = [
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Return null if on studio route to avoid layout overlap in Sanity CMS
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  // Use a dedicated id for the mobile dropdown (not the nav itself)
  const mobileMenuId = "mobile-menu";
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Toggle `inert` so links aren’t focusable when the menu is closed
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    if (mobileOpen) {
      el.removeAttribute("inert");
      // optional: remove aria-hidden if you previously added it
      el.removeAttribute("aria-hidden");
    } else {
      el.setAttribute("inert", "");
      // optional (won’t affect focus since `inert` handles it)
      el.setAttribute("aria-hidden", "true");
    }
  }, [mobileOpen]);

  return (
    <nav
      aria-label="Primary"
      className="absolute top-0 left-0 w-full z-50 text-white font-medium bg-black/20 backdrop-blur-xs shadow">
      <Container className="relative">
        {/* Equal-side layout keeps center logo truly centered */}
        <div className="relative flex items-center">
          {/* LEFT CLUSTER */}
          <div className="flex-1 flex items-center gap-2">
            {/* Mobile: menu on the left */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-controls={mobileMenuId}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close main menu" : "Open main menu"}
              onClick={() => setMobileOpen((o) => !o)}>
              <span className="sr-only">
                {mobileOpen ? "Close main menu" : "Open main menu"}
              </span>
              {mobileOpen ? (
                <X size={22} aria-hidden="true" />
              ) : (
                <Menu size={22} aria-hidden="true" />
              )}
            </button>

            {/* Desktop: left links */}
            <div className="hidden md:flex gap-4">
              {LEFT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={BASE_DESKTOP_CLASS}>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* CENTER LOGO */}
          <Link href="/">
            <Image
              src="/assets/logo_sdg-black.svg"
              alt="Sarvian Design Group"
              loading="eager"
              width={0}
              height={0}
              sizes="130px"
              className="brightness-0 invert"
              style={{
                width: "130px",
                height: "auto",
              }}
              priority
            />
          </Link>

          {/* RIGHT CLUSTER */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {/* Desktop: right links */}
            <div className="hidden md:flex items-center gap-4">
              {RIGHT_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={BASE_DESKTOP_CLASS}>
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div
          id={mobileMenuId}
          ref={menuRef}
          className={`md:hidden grid transition-[grid-template-rows] duration-300 ease-out ${
            mobileOpen ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr] mt-2"
          }`}>
          <div className="overflow-hidden">
            <nav className="flex flex-col gap-2 pb-4 border-t border-white/20">
              {[...LEFT_LINKS, ...RIGHT_LINKS].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm p-2 hover:text-accent transition-colors duration-200">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </Container>
    </nav>
  );
}
