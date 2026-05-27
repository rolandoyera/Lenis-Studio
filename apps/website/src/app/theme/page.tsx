import InstagramIcon from "@/components/icons/InstagramIcon";
import MailIcon from "@/components/icons/MailIcon";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import ArrowButton from "@/components/ui/ArrowButton";
import Container from "@/components/ui/Container";
import H1 from "@/components/ui/H1";
import H2 from "@/components/ui/H2";
import H3 from "@/components/ui/H3";
import H4 from "@/components/ui/H4";
import Main from "@/components/ui/Main";
import P from "@/components/ui/P";
import Image from "next/image";

const COLOR_GROUPS = [
  {
    name: "Cream",
    swatches: [
      { label: "Cream 100", bgClass: "bg-cream-100" },
      { label: "Cream 200", bgClass: "bg-cream-200" },
      { label: "Cream 300", bgClass: "bg-cream-300" },
    ],
  },
  {
    name: "Taupe",
    swatches: [
      { label: "Taupe 600", bgClass: "bg-taupe-600" },
      { label: "Taupe 700", bgClass: "bg-taupe-700" },
      { label: "Taupe 800", bgClass: "bg-taupe-800" },
      { label: "Taupe 900", bgClass: "bg-taupe-900" },
    ],
  },
  {
    name: "Gold",
    swatches: [{ label: "Accent 400", bgClass: "bg-accent" }],
  },
];

export default function ThemePage() {
  return (
    <Main className="bg-white pb-60">
      <div className="h-24 bg-linear-to-b from-taupe-900 to-taupe-800"></div>

      {/* Typography */}
      <Container className="pt-30 flex flex-col gap-6 max-w-[1800px]">
        <H3 className="mb-16">Typography</H3>
        <div className="flex gap-8 mb-16">
          <div className="w-40 shrink-0">
            <H4>Typeface</H4>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-mono text-sm mb-1!">
              Font:Manrope • Color:Taupe 700
            </p>
            <P className="uppercase">ABCDEFGHIJKLMNOPQRSTUVWXYZ</P>
            <P>abcdefghijklmnopqrstuvwxyz</P>
            <P>1234567890</P>
          </div>
        </div>

        <div className="flex gap-8 mb-16">
          <div className="w-40 shrink-0">
            <H4>Paragraphs</H4>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-mono text-sm mb-1!">
              Size:22px • Weight:300 (light) • Line Height: 1.55
            </p>
            <P className="w-[60%]">
              Sarvian designs houses, hotels, and the occasional restaurant. Six
              projects a year. Materials first.
            </P>
          </div>
        </div>

        <div className="flex gap-8 mb-10">
          <div className="w-40 shrink-0">
            <H4>Headings</H4>
          </div>

          <div className="flex flex-col gap-4 mt-1">
            <p className="font-mono text-sm mb-1!">
              Heading 1 • Size:72px • Weight:400 (regular)
            </p>
            <H1 className="w-[70%]">
              We design houses for people that live in them.
            </H1>
          </div>
        </div>

        <div className="flex gap-8 mb-10">
          <div className="w-40 shrink-0"></div>

          <div className="flex flex-col gap-4 mt-1">
            <p className="font-mono text-sm mb-1!">
              Heading 2 • Size:48px • Weight:400 (regular)
            </p>
            <H2 className="w-[70%]">
              We design houses for people that live in them.
            </H2>
          </div>
        </div>

        <div className="flex gap-8 mb-16">
          <div className="w-40 shrink-0"></div>
          <div className="flex flex-col gap-4 mt-1">
            <p className="font-mono text-sm mb-1!">
              Heading 3 • Size:36px • Weight:400 (regular)
            </p>
            <H3 className="w-[70%]">
              We design houses for people that live in them.
            </H3>
          </div>
        </div>

        <div className="flex gap-8 mb-16">
          <div className="w-40 shrink-0">
            <H4>Data</H4>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-mono text-sm mb-1!">
              Font:IBM Plex Mono • Color:Taupe 700
            </p>
            <P className="uppercase font-mono font-normal">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </P>
            <P className="font-mono font-normal">abcdefghijklmnopqrstuvwxyz</P>
            <P className="font-mono font-normal">1234567890</P>
          </div>
        </div>
      </Container>

      <div className="h-px bg-border/60 w-full my-40 max-w-[1800px] mx-auto"></div>

      {/* Colors */}
      <Container className="flex flex-col gap-6 max-w-[1800px]">
        <H3 className="mb-16">Colors</H3>
        {COLOR_GROUPS.map((group) => (
          <div key={group.name} className="flex gap-8 mb-16">
            <div className="w-40 shrink-0">
              <H4>{group.name}</H4>
            </div>
            {group.swatches.map((swatch) => (
              <div key={swatch.label} className="w-[200px] h-[200px]">
                <div
                  className={`${swatch.bgClass} w-full h-full rounded shadow`}></div>
                <p className="text-sm font-mono">{swatch.label}</p>
              </div>
            ))}
          </div>
        ))}
      </Container>

      <div className="h-px bg-border/60 w-full my-40 max-w-[1800px] mx-auto"></div>

      {/* Color Usage  */}
      <Container className="flex flex-col gap-6 max-w-[1800px]">
        <H3 className="mb-16">Color Usage</H3>

        {/*Surfaces*/}
        <div className="flex gap-8 mb-26">
          <div className="w-40 shrink-0">
            <H4>Surfaces</H4>
          </div>
          <div className="w-1/2 h-[400px]">
            <div className="bg-cream-100 w-full h-full rounded p-2 shadow">
              <P className="text-center mb-12">Site Background</P>
              <div className="flex flex-col gap-2 px-6">
                <H3 className="mb-4">
                  Architectural & <br />
                  Interior Design Firm
                </H3>

                <P>
                  We shape spaces where life unfolds. Blending architecture,
                  interiors, and landscape, we craft environments that reflect
                  purpose, enhance well-being, and inspire connection.
                </P>
              </div>
            </div>
            <p className="text-sm font-mono">Cream 100</p>
          </div>
          <div className="w-1/2 h-[400px]">
            <div className="bg-cream-200 w-full h-full rounded p-2 shadow">
              <P className="text-center mb-12">Cards</P>
              <div className="flex flex-col gap-2 px-6">
                <H3 className="-mb-2">The Shul- Bal Harbour</H3>

                <P className="mb-12">Bal Harbour, FL</P>
                <div className="flex justify-between pb-2 relative">
                  <div className="absolute left-0 right-0 bottom-0 h-px bg-border/40" />
                  <div className="absolute left-0 right-0 -bottom-px h-px bg-white" />
                  <span className="text-[16px] font-medium font-mono">
                    Firm
                  </span>
                  <span className="text-[16px] font-mono">
                    Sarvian Design Group
                  </span>
                </div>

                <div className="flex justify-between pb-2 relative">
                  <div className="absolute left-0 right-0 bottom-0 h-px bg-border/40" />
                  <div className="absolute left-0 right-0 -bottom-px h-px bg-white" />
                  <span className="text-[16px] font-medium font-mono">
                    Type
                  </span>
                  <span className="text-[16px] font-mono">Residential</span>
                </div>
              </div>
            </div>
            <p className="text-sm font-mono">Cream 200</p>
          </div>
        </div>

        {/*Backgrounds*/}
        <div className="flex gap-8 mb-26">
          <div className="w-40 shrink-0">
            <H4>Backgrounds</H4>
          </div>

          <div className="w-1/2 h-[200px]">
            <div className="bg-linear-to-b from-taupe-900 to-taupe-800 w-full h-full rounded p-2 shadow">
              <P className="text-center mb-12 text-cream-300">Navbar</P>
              <div className="flex flex-col gap-2 px-6">
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
              </div>
            </div>
            <p className="text-sm font-mono">Gradient Taupe 900 to 800</p>
          </div>
          <div className="w-1/2 h-[400px]">
            <div className="bg-linear-to-b from-taupe-800/95 to-taupe-900 w-full h-full rounded p-2 shadow">
              <P className="text-center mb-12 text-cream-300">Footer</P>
              <div className="flex flex-col gap-2 px-6">
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
            </div>
            <p className="text-sm font-mono">Gradient Taupe 800 to 900</p>
          </div>
        </div>

        {/*Buttons*/}
        <div className="flex gap-8 mb-26">
          <div className="w-40 shrink-0">
            <H4>Buttons</H4>
          </div>
          <div className="w-80 h-20 flex flex-col items-center justify-center">
            <ArrowButton direction="right" className="px-12">
              Contact
            </ArrowButton>
            <p className="text-sm font-mono">Primary Button • Accent</p>
          </div>

          <div className="w-80 h-20 flex flex-col items-center justify-center">
            <ArrowButton
              direction="right"
              variant="secondary"
              className="px-12">
              Next
            </ArrowButton>
            <p className="text-sm font-mono">Secondary Button • Taupe 800</p>
          </div>
        </div>

        <div className="h-px bg-border/60 w-full my-40 max-w-[1800px] mx-auto"></div>

        <div className="flex flex-col items-center justify-center gap-4 pb-20">
          <H3 className="text-center">Design System Documentation</H3>
          <P className="text-center text-taupe-600 max-w-2xl">
            View the complete design reference manual, code tokens,
            copy-to-clipboard swatches, and development checklist guidelines.
          </P>
          <ArrowButton
            href="/theme/guidelines"
            variant="primary"
            className="px-12 mt-4">
            View Interactive Guidelines
          </ArrowButton>
        </div>
      </Container>
    </Main>
  );
}
