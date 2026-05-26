"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import H1 from "@/components/ui/H1";
import H2 from "@/components/ui/H2";
import H3 from "@/components/ui/H3";
import H4 from "@/components/ui/H4";
import Main from "@/components/ui/Main";
import P from "@/components/ui/P";
import ArrowButton from "@/components/ui/ArrowButton";
import Link from "next/link";
import {
  Check,
  Copy,
  Layout,
  Palette,
  Type,
  Terminal,
  ShieldAlert,
} from "lucide-react";

const COLOR_GROUPS = [
  {
    name: "Cream Group",
    description:
      "Used primarily for light background canvases, secondary content areas, and cards.",
    swatches: [
      {
        label: "Cream 100",
        bgClass: "bg-cream-100",
        value: "hsl(40 60% 97%)",
        hex: "#FCF9F3",
        usage: "Default Canvas Background",
      },
      {
        label: "Cream 200",
        bgClass: "bg-cream-200",
        value: "hsl(40 40% 90%)",
        hex: "#F0E9DB",
        usage: "Cards & Elevated Surfaces",
      },
      {
        label: "Cream 300",
        bgClass: "bg-cream-300",
        value: "hsl(40 30% 85%)",
        hex: "#E4DDCD",
        usage: "Borders & Muted Details",
      },
    ],
  },
  {
    name: "Taupe Group",
    description:
      "Deep, organic brown tones for premium typography, header/footer backgrounds, and premium solid blocks.",
    swatches: [
      {
        label: "Taupe 600",
        bgClass: "bg-taupe-600",
        value: "hsl(36 13% 26%)",
        hex: "#4A443A",
        usage: "Secondary Text / Muted Titles",
      },
      {
        label: "Taupe 700",
        bgClass: "bg-taupe-700",
        value: "hsl(36 16% 20%)",
        hex: "#3F3527",
        usage: "Base Body Text Color",
      },
      {
        label: "Taupe 800",
        bgClass: "bg-taupe-800",
        value: "hsl(36 18% 15%)",
        hex: "#362916",
        usage: "Footer Tops & Dark Sections",
      },
      {
        label: "Taupe 900",
        bgClass: "bg-taupe-900",
        value: "hsl(36 15% 10%)",
        hex: "#291D0A",
        usage: "Footer Bottoms & Base Canvas",
      },
    ],
  },
  {
    name: "Gold & Accents",
    description:
      "A rich, vibrant warm accent tone reserved strictly for primary buttons, active states, and highlights.",
    swatches: [
      {
        label: "Accent 400",
        bgClass: "bg-accent",
        value: "hsl(34, 34%, 48%)",
        hex: "#A37F51",
        usage: "Primary CTAs & Active Highlights",
      },
    ],
  },
];

export default function GuidelinesPage() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <Main className="bg-white pb-40">
      {/* Dynamic dark header background to frame the navigation */}
      <div className="h-24 bg-linear-to-b from-taupe-900 to-taupe-800"></div>

      <Container className="max-w-[1400px] mt-16 px-4 md:px-8">
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/theme"
            className="text-sm font-mono text-taupe-600 hover:text-accent flex items-center gap-1.5 transition-colors">
            ← Visual Theme Playground
          </Link>
          <span className="text-[12px] font-mono bg-cream-300 text-taupe-800 px-3 py-1 rounded-full uppercase tracking-wider">
            v1.2.0 Stable
          </span>
        </div>

        {/* Hero Title */}
        <div className="border-b border-border/40 pb-12 mb-16">
          <H1 className="mb-4">Design System</H1>
          <P className="text-taupe-600 max-w-4xl">
            Official typography tokens, harmonic color guidelines, component
            standards, and architectural design principles powering the{" "}
            <span className="text-accent font-bold">Sarvian Design Group</span>{" "}
            identity. Use this documentation to create unified and premium
            digital spaces.
          </P>
        </div>

        {/* Core Layout Grid: Left Sticky Nav, Right Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28 flex flex-col gap-1">
              <p className="text-[12px] font-mono uppercase tracking-widest text-taupe-600/70 mb-4 px-3">
                Guidelines Navigation
              </p>
              <a
                href="#typography"
                className="flex items-center gap-3 px-3 py-2.5 rounded text-taupe-700 hover:bg-cream-200 hover:text-accent transition-all duration-200 font-medium">
                <Type size={18} /> Typography Scale
              </a>
              <a
                href="#colors"
                className="flex items-center gap-3 px-3 py-2.5 rounded text-taupe-700 hover:bg-cream-200 hover:text-accent transition-all duration-200 font-medium">
                <Palette size={18} /> Color System
              </a>
              <a
                href="#usage"
                className="flex items-center gap-3 px-3 py-2.5 rounded text-taupe-700 hover:bg-cream-200 hover:text-accent transition-all duration-200 font-medium">
                <Layout size={18} /> Surfaces & Layout
              </a>
              <a
                href="#ui-elements"
                className="flex items-center gap-3 px-3 py-2.5 rounded text-taupe-700 hover:bg-cream-200 hover:text-accent transition-all duration-200 font-medium">
                <Terminal size={18} /> UI Components
              </a>
              <a
                href="#best-practices"
                className="flex items-center gap-3 px-3 py-2.5 rounded text-taupe-700 hover:bg-cream-200 hover:text-accent transition-all duration-200 font-medium">
                <ShieldAlert size={18} /> Best Practices
              </a>

              <div className="mt-8 p-6 bg-cream-200 rounded border border-border/40">
                <H4 className="mb-2 text-base">Developer Tools</H4>
                <p className="text-xs text-taupe-600 leading-relaxed mb-4">
                  Theme constants are centrally managed in Tailwind classes and
                  globals.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => copyToClipboard("@import 'tailwindcss';")}
                    className="text-xs font-mono bg-cream-300 text-taupe-800 p-2 rounded hover:bg-cream-100 flex items-center justify-between transition-colors">
                    <span>tailwind-v4</span>
                    {copiedText === "@import 'tailwindcss';" ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT WORKSPACE */}
          <div className="lg:col-span-9 flex flex-col gap-24">
            {/* SECTION 1: TYPOGRAPHY */}
            <section id="typography" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
                <Type className="text-accent" size={24} />
                <H2 className="text-2xl lg:text-3xl font-semibold m-0">
                  1. Typography Guidelines
                </H2>
              </div>

              <P className="mb-8 text-taupe-600">
                Our design focuses on lightweight typography and loose leading
                to convey a minimalist, open-concept feel. We strictly use{" "}
                <span className="font-semibold text-taupe-800">Manrope</span>{" "}
                for standard copy and headings, and monospaced configurations
                for structured details.
              </P>

              {/* Typography Preview Grid */}
              <div className="bg-cream-200 border border-border/40 rounded p-8 flex flex-col gap-8 shadow-sm">
                <div className="pb-6 border-b border-border/40">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[12px] font-mono text-accent uppercase tracking-wider">
                      Heading 1 (`&lt;H1&gt;`) — 72px / Regular
                    </span>
                    <span className="text-xs font-mono text-taupe-600">
                      weight: 400 • line-height: 1.1
                    </span>
                  </div>
                  <H1>We design houses for people that live in them.</H1>
                </div>

                <div className="pb-6 border-b border-border/40">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[12px] font-mono text-accent uppercase tracking-wider">
                      Heading 2 (`&lt;H2&gt;`) — 48px / Regular
                    </span>
                    <span className="text-xs font-mono text-taupe-600">
                      weight: 400 • line-height: 1.15
                    </span>
                  </div>
                  <H2>We design houses for people that live in them.</H2>
                </div>

                <div className="pb-6 border-b border-border/40">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[12px] font-mono text-accent uppercase tracking-wider">
                      Heading 3 (`&lt;H3&gt;`) — 36px / Regular
                    </span>
                    <span className="text-xs font-mono text-taupe-600">
                      weight: 400 • line-height: 1.2
                    </span>
                  </div>
                  <H3>We design houses for people that live in them.</H3>
                </div>

                <div className="pb-6 border-b border-border/40">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[12px] font-mono text-accent uppercase tracking-wider">
                      Paragraph (`&lt;P&gt;`) — 22px / Light
                    </span>
                    <span className="text-xs font-mono text-taupe-600">
                      weight: 300 • line-height: 1.55
                    </span>
                  </div>
                  <P>
                    Sarvian designs houses, hotels, and the occasional
                    restaurant. Six projects a year. Materials first.
                  </P>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[12px] font-mono text-accent uppercase tracking-wider">
                      Metadata Monospace (`.font-mono`) — 16px
                    </span>
                    <span className="text-xs font-mono text-taupe-600">
                      weight: 400 • tracking: standard
                    </span>
                  </div>
                  <p className="font-mono text-[16px] text-taupe-700">
                    Firm: Sarvian Design Group • Type: Residential Custom
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 2: COLORS */}
            <section id="colors" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
                <Palette className="text-accent" size={24} />
                <H2 className="text-2xl lg:text-3xl font-semibold m-0">
                  2. Organic Color System
                </H2>
              </div>

              <P className="mb-8 text-taupe-600">
                Inspired by natural stone, wood, sand, and architectural
                materials. Tap any swatch value or Tailwind utility to copy it
                instantly.
              </P>

              <div className="flex flex-col gap-12">
                {COLOR_GROUPS.map((group) => (
                  <div
                    key={group.name}
                    className="bg-cream-200 border border-border/40 rounded p-8 shadow-sm">
                    <H3 className="mb-2 text-xl font-medium">{group.name}</H3>
                    <p className="text-sm text-taupe-600 mb-6">
                      {group.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {group.swatches.map((swatch) => (
                        <div
                          key={swatch.label}
                          className="bg-cream-100 rounded p-4 border border-border/30 flex flex-col gap-3">
                          {/* Color preview */}
                          <div
                            className={`${swatch.bgClass} h-32 w-full rounded shadow-inner border border-black/5`}></div>

                          {/* Info & Copy triggers */}
                          <div>
                            <p className="font-medium text-taupe-800 text-sm">
                              {swatch.label}
                            </p>
                            <p className="text-[11px] text-taupe-600 mb-2 font-mono">
                              {swatch.usage}
                            </p>

                            <div className="flex flex-col gap-1.5 mt-2">
                              <button
                                onClick={() => copyToClipboard(swatch.bgClass)}
                                className="flex items-center justify-between text-xs font-mono bg-cream-200 hover:bg-cream-300 text-taupe-700 py-1.5 px-2 rounded transition-colors text-left">
                                <span className="opacity-75">Tailwind:</span>
                                <span className="font-semibold flex items-center gap-1">
                                  {swatch.bgClass}
                                  {copiedText === swatch.bgClass ? (
                                    <Check
                                      size={10}
                                      className="text-green-600"
                                    />
                                  ) : (
                                    <Copy size={10} />
                                  )}
                                </span>
                              </button>

                              <button
                                onClick={() => copyToClipboard(swatch.value)}
                                className="flex items-center justify-between text-xs font-mono bg-cream-200 hover:bg-cream-300 text-taupe-700 py-1.5 px-2 rounded transition-colors text-left">
                                <span className="opacity-75">Raw (HSL):</span>
                                <span className="font-semibold flex items-center gap-1">
                                  {swatch.value}
                                  {copiedText === swatch.value ? (
                                    <Check
                                      size={10}
                                      className="text-green-600"
                                    />
                                  ) : (
                                    <Copy size={10} />
                                  )}
                                </span>
                              </button>

                              <button
                                onClick={() => copyToClipboard(swatch.hex)}
                                className="flex items-center justify-between text-xs font-mono bg-cream-200 hover:bg-cream-300 text-taupe-700 py-1.5 px-2 rounded transition-colors text-left">
                                <span className="opacity-75">Raw (HEX):</span>
                                <span className="font-semibold flex items-center gap-1 text-accent">
                                  {swatch.hex}
                                  {copiedText === swatch.hex ? (
                                    <Check
                                      size={10}
                                      className="text-green-600"
                                    />
                                  ) : (
                                    <Copy size={10} />
                                  )}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 3: USAGE & LAYOUT */}
            <section id="usage" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
                <Layout className="text-accent" size={24} />
                <H2 className="text-2xl lg:text-3xl font-semibold m-0">
                  3. Surfaces & Layout Gradients
                </H2>
              </div>

              <P className="mb-8 text-taupe-600">
                To create contrast and premium depth, layout surfaces must
                adhere strictly to these gradient and background structures:
              </P>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Navbar Card */}
                <div className="bg-cream-200 border border-border/40 rounded p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[11px] font-mono bg-cream-300 text-taupe-800 px-2 py-0.5 rounded uppercase font-medium">
                      Header / Navigation Bar
                    </span>
                    <H4 className="mt-4 mb-2">Gradient: Taupe 900 to 800</H4>
                    <p className="text-sm text-taupe-600 leading-relaxed mb-6">
                      Frames the page top with robust dark contrast. Translates
                      to clean visibility of logos and links.
                    </p>
                  </div>
                  <div className="bg-linear-to-b from-taupe-900 to-taupe-800 rounded p-4 border border-black/10 flex justify-center">
                    <span className="text-xs font-mono text-cream-300">
                      bg-linear-to-b from-taupe-900 to-taupe-800
                    </span>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="bg-cream-200 border border-border/40 rounded p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[11px] font-mono bg-cream-300 text-taupe-800 px-2 py-0.5 rounded uppercase font-medium">
                      Footer Surface
                    </span>
                    <H4 className="mt-4 mb-2">Gradient: Taupe 800 to 900</H4>
                    <p className="text-sm text-taupe-600 leading-relaxed mb-6">
                      Provides a heavy visual baseline at the bottom of pages,
                      blending seamlessly into dark page endpoints.
                    </p>
                  </div>
                  <div className="bg-linear-to-b from-taupe-800/95 to-taupe-900 rounded p-4 border border-black/10 flex justify-center">
                    <span className="text-xs font-mono text-cream-300">
                      from-taupe-800/95 to-taupe-900
                    </span>
                  </div>
                </div>

                {/* Main Canvas Card */}
                <div className="bg-cream-200 border border-border/40 rounded p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[11px] font-mono bg-cream-300 text-taupe-800 px-2 py-0.5 rounded uppercase font-medium">
                      Site Canvas
                    </span>
                    <H4 className="mt-4 mb-2">Background: Cream 100</H4>
                    <p className="text-sm text-taupe-600 leading-relaxed mb-6">
                      Standard background for high visibility of large
                      architectural portfolio photography.
                    </p>
                  </div>
                  <div className="bg-cream-100 rounded p-4 border border-border/30 flex justify-center">
                    <span className="text-xs font-mono text-taupe-700">
                      bg-cream-100
                    </span>
                  </div>
                </div>

                {/* Card Surface Card */}
                <div className="bg-cream-200 border border-border/40 rounded p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[11px] font-mono bg-cream-300 text-taupe-800 px-2 py-0.5 rounded uppercase font-medium">
                      Elevated Content Surfaces
                    </span>
                    <H4 className="mt-4 mb-2">Background: Cream 200</H4>
                    <p className="text-sm text-taupe-600 leading-relaxed mb-6">
                      Creates structural elevation for secondary information
                      blocks, text overlays, and specification grids.
                    </p>
                  </div>
                  <div className="bg-cream-200 rounded p-4 border border-border/50 flex justify-center">
                    <span className="text-xs font-mono text-taupe-700">
                      bg-cream-200
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: INTERACTIVE UI COMPONENT SHOWCASE */}
            <section id="ui-elements" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
                <Terminal className="text-accent" size={24} />
                <H2 className="text-2xl lg:text-3xl font-semibold m-0">
                  4. UI Component Library Standards
                </H2>
              </div>

              <P className="mb-8 text-taupe-600">
                Core interactive controls must use standardized theme
                structures. The primary control element is the animated{" "}
                <code className="bg-cream-300 text-taupe-800 px-1 rounded">
                  ArrowButton
                </code>{" "}
                component.
              </P>

              <div className="bg-cream-200 border border-border/40 rounded p-8 flex flex-col gap-10 shadow-sm">
                {/* Variant 1: Primary */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center border-b border-border/30 pb-8">
                  <div className="xl:col-span-4 flex flex-col gap-2">
                    <span className="text-xs font-mono text-accent uppercase tracking-wider">
                      Button Variant: Primary
                    </span>
                    <H4 className="text-lg">Gold to Taupe 800</H4>
                    <p className="text-xs text-taupe-600 leading-relaxed">
                      Reserved strictly for major actions like submitting forms,
                      contacts, and starts.
                    </p>
                  </div>
                  <div className="xl:col-span-3 flex justify-start pl-4">
                    <ArrowButton direction="right" variant="primary">
                      Contact
                    </ArrowButton>
                  </div>
                  <div className="xl:col-span-5 bg-cream-100 p-4 rounded border border-border/30 font-mono text-xs text-taupe-800">
                    {`// Primary Call-To-Action\n<ArrowButton variant="primary">\n  Contact\n</ArrowButton>`}
                  </div>
                </div>

                {/* Variant 2: Secondary */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
                  <div className="xl:col-span-4 flex flex-col gap-2">
                    <span className="text-xs font-mono text-accent uppercase tracking-wider">
                      Button Variant: Secondary
                    </span>
                    <H4 className="text-lg">Taupe 800 to Gold</H4>
                    <p className="text-xs text-taupe-600 leading-relaxed">
                      Used for secondary triggers, paging, back buttons, and
                      carousel slides.
                    </p>
                  </div>
                  <div className="xl:col-span-3 flex justify-start pl-4">
                    <ArrowButton direction="right" variant="secondary">
                      Next
                    </ArrowButton>
                  </div>
                  <div className="xl:col-span-5 bg-cream-100 p-4 rounded border border-border/30 font-mono text-xs text-taupe-800">
                    {`// Secondary Navigation Trigger\n<ArrowButton variant="secondary">\n  Next\n</ArrowButton>`}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: DEVELOPMENT BEST PRACTICES */}
            <section id="best-practices" className="scroll-mt-28">
              <div className="flex items-center gap-3 mb-6 border-b border-border/30 pb-3">
                <ShieldAlert className="text-accent" size={24} />
                <H2 className="text-2xl lg:text-3xl font-semibold m-0">
                  5. Best Practices Checklist
                </H2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Standard Rules */}
                <div className="bg-cream-200 border border-border/40 rounded p-8 shadow-sm flex flex-col gap-4">
                  <H4 className="text-base text-accent font-semibold flex items-center gap-2">
                    <Check size={16} className="text-green-600" /> Coding Do's
                  </H4>
                  <ul className="text-sm text-taupe-700 flex flex-col gap-3 list-none pl-0">
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>
                        Always use custom typography components (`H1`, `H2`,
                        `P`) from `@/components/ui/` to ensure text balancing
                        and responsive scales are inherited automatically.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>
                        Use Tailwind color names mapped from the theme (e.g.
                        `bg-cream-100`, `text-taupe-700`, `bg-accent`) instead
                        of arbitrary colors or custom CSS configurations.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>
                        Use `.font-mono` exclusively for secondary technical
                        details, project specification labels, and dates.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Anti-Patterns */}
                <div className="bg-cream-200 border border-border/40 rounded p-8 shadow-sm flex flex-col gap-4">
                  <H4 className="text-base text-red-700 font-semibold flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-700" /> Coding
                    Don'ts
                  </H4>
                  <ul className="text-sm text-taupe-700 flex flex-col gap-3 list-none pl-0">
                    <li className="flex gap-2 text-red-900/90">
                      <span className="text-red-700">•</span>
                      <span>
                        Avoid hardcoding HEX (`#ffffff`) or HSL value
                        configurations in styles. Doing so violates tailwind
                        configurations and breaks maintainability.
                      </span>
                    </li>
                    <li className="flex gap-2 text-red-900/90">
                      <span className="text-red-700">•</span>
                      <span>
                        Never assign pure black (`#000000` / `bg-black` text) as
                        font color. To maintain natural, premium organic
                        layouts, use `text-taupe-700` as baseline.
                      </span>
                    </li>
                    <li className="flex gap-2 text-red-900/90">
                      <span className="text-red-700">•</span>
                      <span>
                        Do not manually force bottom margin overrides to reset
                        paragraphs. The Custom `{"<P>"}` component natively
                        handles sibling limits with automatic `last:mb-0`
                        overrides.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Container>
    </Main>
  );
}
