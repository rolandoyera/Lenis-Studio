// app/projects/[slug]/page.tsx
import Image from "next/image";
import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";
import { urlFor, type SanityImageWithAlt } from "@/sanity/lib/image";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import ProjectButton from "@/components/ui/ProjectButton";
import NextProject from "@/components/NextProject";
import PanoramaViewer from "@/components/ui/PanoramaViewer";
import P from "@/components/ui/P";

/* -------------------- Types -------------------- */

type Project = {
  _id: string;
  title: string;
  slug?: { current: string } | string;
  location?: string;
  type?: string;
  year?: number;
  size?: string | number;

  heroImage?: SanityImageWithAlt;
  mainImage?: SanityImageWithAlt;
  gallery?: SanityImageWithAlt[];
  panorama360?: SanityImageWithAlt;

  intro?: string;
  description?: PortableTextBlock[];
  body?: PortableTextBlock[];
};

/* -------------------- GROQ -------------------- */

const PROJECT_BY_SLUG = groq`*[_type=="project" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  location,
  type,
  year,
  size,
  heroImage{ ..., alt, asset->{ url, metadata{ dimensions } } },
  mainImage{ ..., alt, asset->{ url, metadata{ dimensions } } },
  gallery[]{ ..., alt, asset->{ url, metadata{ dimensions } } },
  panorama360{ ..., alt, asset->{ url, metadata{ dimensions } } },
  intro,
  description,
  body
}`;

const ALL_SLUGS = groq`*[_type=="project" && defined(slug.current)]{ "slug": slug.current }`;

const ALL_PROJECTS_SORTED = groq`*[_type=="project" && defined(slug.current)]{
  title,
  "slug": slug.current
} | order(coalesce(year, 0) desc, _createdAt desc)`;

/* -------------------- ISR -------------------- */

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs: { slug: string }[] = await client.fetch(ALL_SLUGS);
  return slugs.map((s) => ({ slug: s.slug }));
}

/* -------------------- Page -------------------- */

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [data, allProjects] = await Promise.all([
    client.fetch<Project | null>(PROJECT_BY_SLUG, { slug }),
    client.fetch<{ title: string; slug: string }[]>(ALL_PROJECTS_SORTED),
  ]);

  if (!data) return notFound();

  const currentIndex = allProjects.findIndex((p) => p.slug === slug);
  const prevProject =
    currentIndex !== -1 && allProjects.length > 1
      ? allProjects[
          (currentIndex - 1 + allProjects.length) % allProjects.length
        ]
      : null;
  const nextProject =
    currentIndex !== -1 && allProjects.length > 1
      ? allProjects[(currentIndex + 1) % allProjects.length]
      : null;

  const hero = data.heroImage || data.mainImage;
  const rich = data.description ?? data.body;
  const gallery = Array.isArray(data.gallery) ? data.gallery : [];
  const panorama = data.panorama360;

  // Sort: landscapes first, then portraits, then square/unknown (stable within groups)
  const sortedGallery: SanityImageWithAlt[] = gallery
    .map((img, idx) => {
      const dims = img.asset.metadata?.dimensions;
      const ar =
        dims?.aspectRatio ??
        (dims?.width && dims?.height ? dims.width / dims.height : 1);
      const group = ar > 1.01 ? 0 : ar < 0.99 ? 1 : 2; // 0 = landscape, 1 = portrait, 2 = square/unknown
      return { img, idx, group };
    })
    .sort((a, b) => (a.group === b.group ? a.idx - b.idx : a.group - b.group))
    .map((x) => x.img);

  return (
    <main>
      <div className="mx-auto">
        {/* 1) Full-bleed banner */}
        {hero && (
          <section className="relative h-dvh overflow-hidden">
            <Image
              src={urlFor(hero).width(2880).height(1620).auto("format").url()}
              alt={hero.alt || data.title}
              fill
              priority
              quality={90}
              loading="eager"
              fetchPriority="high"
              sizes="100vw"
              className="object-cover"
              style={
                { viewTransitionName: `hero-${slug}` } as React.CSSProperties
              }
            />
          </section>
        )}

        {/* 2) Content row: left = info (sticky), right = gallery */}
        <section className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-8 px-6 xl:p-6">
          {/* LEFT: Project info */}
          <aside className="xl:col-span-4">
            <div className="xl:sticky xl:top-22">
              <div className="bg-card p-2 sm:p-4 md:p-8 lg:p-12 rounded shadow">
                <h1 className="text-[38px]/[1.1] tracking-[-0.012em]">
                  {data.title}
                </h1>
                {data.location && (
                  <P className="text-[16px]">{data.location}</P>
                )}
                <div className="my-10 lg:my-16 space-y-2">
                  <div className="flex justify-between pb-2 relative">
                    <div className="absolute left-0 right-0 bottom-0 h-px bg-border/30" />
                    <div className="absolute left-0 right-0 -bottom-px h-px bg-white" />
                    <span className="text-[16px] font-medium font-mono">
                      Firm
                    </span>
                    <span className="text-[16px] font-mono">
                      Sarvian Design Group
                    </span>
                  </div>

                  {data.type && (
                    <div className="flex justify-between pb-2 relative">
                      <div className="absolute left-0 right-0 bottom-0 h-px bg-border/30" />
                      <div className="absolute left-0 right-0 -bottom-px h-px bg-white" />
                      <span className="text-[16px] font-medium font-mono">
                        Type
                      </span>
                      <span className="text-[16px] font-mono">{data.type}</span>
                    </div>
                  )}

                  {data.size && (
                    <div className="flex justify-between pb-2 relative">
                      <div className="absolute left-0 right-0 bottom-0 h-px bg-border/30" />
                      <div className="absolute left-0 right-0 -bottom-px h-px bg-white" />
                      <span className="text-[16px] font-medium font-mono">
                        Size
                      </span>
                      <span className="text-[16px] font-mono">
                        {typeof data.size === "number"
                          ? `${data.size.toLocaleString()} Sq Ft`
                          : data.size}
                      </span>
                    </div>
                  )}

                  {typeof data.year === "number" && (
                    <div className="flex justify-between">
                      <span className="text-[16px] font-medium font-mono">
                        Year
                      </span>
                      <span className="text-[16px] font-mono">{data.year}</span>
                    </div>
                  )}
                </div>

                {data.intro && (
                  <p className="mt-16 text-sm leading-6 text-white/85">
                    {data.intro}
                  </p>
                )}

                {Array.isArray(rich) && rich.length > 0 && (
                  <div className="mt-10 prose prose-invert prose-sm max-w-none richtext text-justify">
                    <PortableText value={rich} />
                  </div>
                )}

                <div className="w-fit mt-16 ml-auto">
                  <ProjectButton location="project_detail">
                    Start a Similar Project
                  </ProjectButton>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT: Image stack (single column, natural aspect, NO rounding) */}
          <div className="xl:col-span-8">
            {(sortedGallery.length > 0 || panorama) && (
              <div className="flex flex-col gap-8">
                {sortedGallery.length > 0 && (
                  <div className="flex flex-col gap-6">
                    {sortedGallery.map((img, i) => {
                      const dims = img.asset.metadata?.dimensions;
                      const ar = dims?.aspectRatio ?? 4 / 3;
                      const width = Math.min(dims?.width ?? 1600, 1800);
                      const height = Math.round(width / ar);

                      return (
                        <Image
                          key={i}
                          src={urlFor(img).width(width).auto("format").url()}
                          alt={img.alt || `Project image ${i + 1}`}
                          width={width}
                          height={height}
                          quality={90}
                          loading="lazy"
                          decoding="async"
                          sizes="(min-width:1280px) 66vw, 100vw"
                          className="w-full h-auto rounded shadow"
                        />
                      );
                    })}
                  </div>
                )}

                {panorama && (
                  <div className="w-full pt-4 border-t border-border/30">
                    <PanoramaViewer
                      imageUrl={panorama.asset.url}
                      alt={panorama.alt || "360 degree room view"}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
      <NextProject prevProject={prevProject} nextProject={nextProject} />
    </main>
  );
}
