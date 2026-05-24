"use client";
import Link from "next/link";
import Image from "next/image";
import Container from "./ui/Container";
import { usePathname } from "next/navigation";
import ArrowButton from "./ui/ArrowButton";

const LINKS = [
  { name: "Projects", href: "/projects" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar2() {
  const pathname = usePathname();

  // Return null if on studio route to avoid layout overlap in Sanity CMS
  if (pathname?.startsWith("/studio")) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="absolute top-0 left-0 w-full z-50 text-white font-medium bg-black/20 backdrop-blur-xs shadow h-24">
      <Container className="relative flex items-center h-24">
        <div className="flex-1 flex items-center justify-between">
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

          <div className="flex items-center gap-10">
            <ul className="flex items-center gap-10 w-auto">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="relative text-lg font-semibold uppercase group py-1">
                    {link.name}
                    <span className="absolute bottom-0 left-1/2 w-0 h-[1.5px] bg-white transition-all duration-300 -translate-x-1/2 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
            <ArrowButton
              onClick={() => console.log("clicked")}
              className="bg-white text-foreground">
              Let's Talk
            </ArrowButton>
          </div>
        </div>
      </Container>
    </nav>
  );
}
