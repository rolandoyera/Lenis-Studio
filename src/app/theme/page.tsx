import Container from "@/components/ui/Container";
import H1 from "@/components/ui/H1";
import H2 from "@/components/ui/H2";
import H3 from "@/components/ui/H3";
import H4 from "@/components/ui/H4";
import Main from "@/components/ui/Main";
import P from "@/components/ui/P";

export default function ThemePage() {
  return (
    <Main className="bg-white pb-60">
      <Container className="pt-50 flex flex-col gap-6">
        <H3 className="mb-16">Colors</H3>
        <div className="flex gap-8 mb-16">
          <div className="w-40 shrink-0">
            <H4>Surfaces</H4>
          </div>
          <div className="w-[200px] h-[200px] ">
            <div className="bg-cream-100 w-full h-full"></div>
            <p className="text-sm font-mono">Cream 100</p>
          </div>
          <div className="w-[200px] h-[200px] ">
            <div className="bg-cream-200 w-full h-full"></div>
            <p className="text-sm font-mono">Cream 200</p>
          </div>
          <div className="w-[200px] h-[200px] ">
            <div className="bg-cream-300 w-full h-full"></div>
            <p className="text-sm font-mono">Cream 300</p>
          </div>
        </div>
        <div className="flex gap-8 mb-16">
          <div className="w-40 shrink-0">
            <H4>Backgrounds & Buttons</H4>
          </div>
          <div className="w-[200px] h-[200px] ">
            <div className="bg-taupe-600 w-full h-full"></div>
            <p className="text-sm font-mono">Taupe 600</p>
          </div>
          <div className="w-[200px] h-[200px] ">
            <div className="bg-taupe-700 w-full h-full"></div>
            <p className="text-sm font-mono">Taupe 700</p>
          </div>
          <div className="w-[200px] h-[200px] ">
            <div className="bg-taupe-800 w-full h-full"></div>
            <p className="text-sm font-mono">Taupe 800</p>
          </div>
          <div className="w-[200px] h-[200px] ">
            <div className="bg-taupe-900 w-full h-full"></div>
            <p className="text-sm font-mono">Taupe 900</p>
          </div>
        </div>
      </Container>

      <Container className="pt-50 flex flex-col gap-6">
        <H3 className="mb-16">Typography</H3>
        <div className="flex gap-8 mb-16">
          <div className="w-40 shrink-0">
            <H4>Typeface</H4>
          </div>

          <div className="flex flex-col gap-4 mt-1">
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

          <div className="flex flex-col gap-4 mt-1">
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

        <div className="flex gap-8">
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
      </Container>
    </Main>
  );
}
