"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Connect from "@/components/Connect";
import Container from "@/components/ui/Container";
import H1 from "@/components/ui/H1";
import H2 from "@/components/ui/H2";
import Main from "@/components/ui/Main";
import P from "@/components/ui/P";
import { cn } from "@/lib/utils";

// ScrollReveal utility to wrap blocks with buttery-smooth entrance transitions
function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.15 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-1000 ease-[cubic-bezier(.215,.61,.355,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
        className,
      )}>
      {children}
    </div>
  );
}

export default function AboutContent() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Main className="bg-background">
      {/* Section 1: Full-Screen Hero Editorial Cover */}
      <section className="relative h-dvh w-full overflow-hidden bg-black">
        <Image
          src="/about/Sarvian-Design-Group.jpg"
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
              <ScrollReveal>
                <H1 className="leading-h1 tracking-[-0.02em] font-normal uppercase text-white drop-shadow-md">
                  The Art of Refined Living
                </H1>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <p className="text-lg md:text-[24px] leading-relaxed text-taupe-100 font-light max-w-3xl drop-shadow-sm">
                  Blending striking architectural forms with thoughtfully
                  curated interiors, we create homes that unite nature and
                  design into one harmonious experience.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the content wrapped in standard container */}
      <Container className="space-y-24 py-16 md:py-24 lg:py-32 max-w-[1500px]">
        {/* Section 2: Narrative & Vision Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 pt-20">
          <div className="lg:col-span-5">
            <ScrollReveal>
              <H2 className="tracking-[-0.015em] font-normal uppercase text-accent">
                A Legacy of Architecture & Interiors
              </H2>
            </ScrollReveal>
          </div>
          <div className="lg:col-span-7 space-y-8">
            <ScrollReveal delay={150}>
              <P>
                At Sarvian Design Group, we believe that high-end spaces should
                not only capture visual excellence but should flow effortlessly,
                enhancing the way you live. We design for individuals who
                appreciate scale, harmony, and timeless sophistication.
              </P>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <P>
                From our design studio in South Florida, our team brings decades
                of combined expertise in drafting, custom craftsmanship, and
                interior curation. We orchestrate every stage of the
                process - from early spatial planning to the final selection of
                art and textures - ensuring your vision is executed with extreme
                precision.
              </P>
            </ScrollReveal>
          </div>
        </section>

        {/* Section 3: Meet the Principal */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center pt-32 border-t border-border/20">
          {/* Left Column: Portrait */}
          <div className="lg:col-span-5">
            <ScrollReveal className="relative w-full aspect-3/4 overflow-hidden rounded shadow-2xl group border border-border/10">
              <Image
                src="/about/sarvian-design-group-oshrat-rothschild.jpg"
                alt="Oshrat Rothschild - Principal Designer of Sarvian Design Group"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                quality={90}
                className="object-cover object-top transition-transform duration-1000 ease-[cubic-bezier(.215,.61,.355,1)] group-hover:scale-[1.025]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent pointer-events-none" />
            </ScrollReveal>
          </div>

          {/* Right Column: Bio */}
          <div className="lg:col-span-7 space-y-6">
            <ScrollReveal>
              <span className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">
                Creative Leadership
              </span>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <H2 className="font-normal uppercase tracking-tight">
                Oshrat Rothschild
              </H2>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <p className="text-sm md:text-base font-mono uppercase text-taupe-500 -mt-2">
                Principal & Lead Designer
              </p>
            </ScrollReveal>
            <ScrollReveal delay={250}>
              <P>
                Oshrat's vision is rooted in clean lines, natural textures, and
                harmonious flow. By pairing organic, noble materials with
                curated, modern details, she crafts spaces that feel expansive
                yet deeply intimate and sophisticated.
              </P>
            </ScrollReveal>
            <ScrollReveal delay={350}>
              <P>
                Her philosophy balances scale, comfort, and architectural
                honesty. By treating lighting, materials, and custom cabinetry
                as structural elements of design, she tailors every project in
                Fort Lauderdale and Miami to reflect the distinct lifestyle and
                aspirations of South Floridians.
              </P>
            </ScrollReveal>
          </div>
        </section>
      </Container>

      {/* Section 4: Global Connect CTA */}
      <Connect />
    </Main>
  );
}
