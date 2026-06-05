"use client";

import { TextEffect } from "@/components/motion-primitives/text-effect";
import Container from "@/components/ui/Container";
import H1 from "@/components/ui/H1";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function PressPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <>
      {/* Section 1: Full-Screen Hero Editorial Cover */}
      <section className="relative h-dvh w-full overflow-hidden bg-black">
        <Image
          src="/projects/sdg-bedroom-remodel-armoire-7.jpg"
          alt="Sarvian Design Group architecture and interior showcase"
          fill
          priority
          sizes="100vw"
          quality={90}
          style={{
            transform: `translate3d(0, ${scrollY * 0.35}px, 0) scale(1.1)`,
          }}
          className="object-cover"
        />
        {/* Soft vertical gradient overlay (transparent at top, solid black at bottom where text sits) */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent pointer-events-none z-10" />

        {/* Text and Title Overlay - aligned to bottom-left */}
        <div className="absolute inset-0 flex items-end z-20 pb-16 md:pb-24 lg:pb-32 px-6">
          <div className="mx-auto max-w-[1400px] w-full">
            <div className="max-w-[900px] space-y-6">
              <TextEffect
                preset="fade-in-blur"
                className="text-4xl lg:text-7xl font-normal text-balance tracking-tight text-white uppercase"
                speedReveal={5}
                speedSegment={0.3}
                as="h1">
                Press & Media
              </TextEffect>
              <TextEffect
                preset="fade-in-blur"
                speedReveal={5}
                speedSegment={0.3}
                className="text-taupe-100 text-base lg:text-[22px] font-light text-balance leading-[1.55]">
                Every project tells a story—one shaped by thoughtful
                architecture, refined interiors, and the art of creating spaces
                that feel both luxurious and deeply personal. Our studio is
                proud to share the moments, publications, and press features
                that highlight our work in South Florida.
              </TextEffect>
            </div>
          </div>
        </div>
      </section>
      <main className="px-4 lg:px-8 mb-20">
        <Container>
          <div className="w-full flex flex-col items-center justify-center py-10 lg:py-30">
            <H1>Featured In</H1>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <Image
              src="/assets/Florida-design-magazine-cover.jpg"
              alt="Florida Design Magazine Press Article"
              width={911}
              height={1069}
            />
            <Image
              src="/assets/sarvian-design-florida-design-magazine_Page_1.jpg"
              alt=""
              width={6000}
              height={3000}
            />
            <Image
              src="/assets/sarvian-design-florida-design-magazine_Page_2.jpg"
              alt=""
              width={6000}
              height={3000}
            />
            <Image
              src="/assets/sarvian-design-florida-design-magazine_Page_3.jpg"
              alt=""
              width={6000}
              height={3000}
            />
            <Image
              src="/assets/sarvian-design-florida-design-magazine_Page_4.jpg"
              alt=""
              width={6000}
              height={3000}
            />
          </div>
        </Container>
      </main>
    </>
  );
}
