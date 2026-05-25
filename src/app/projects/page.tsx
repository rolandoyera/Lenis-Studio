// app/projects/page.tsx
import Image from "next/image";
import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";
import Main from "@/components/ui/Main";
import H1 from "@/components/ui/H1";
import H2 from "@/components/ui/H2";

export const revalidate = 60; // Revalidate the page every 60 seconds

const QUERY = groq`
  *[_type == "project" && defined(mainImage)]{
    _id,
    title,
    location,
    year,
    "slug": slug.current,
    "imageUrl": mainImage.asset->url
  } | order(coalesce(year, 0) desc, _createdAt desc)
`;

import TransitionLink from "@/components/ui/TransitionLink";
import P from "@/components/ui/P";

export default async function ProjectsPage() {
  let projects: {
    _id: string;
    title: string;
    location: string;
    slug: string;
    imageUrl: string;
  }[] = [];

  try {
    projects = await client.fetch(QUERY);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    // Could add a user-friendly error message here
  }

  return (
    <Main className="px-8 mb-20 mt-24">
      <div className="w-full flex flex-col items-center justify-center py-20">
        <H1>Latest Projects</H1>
        <P className="mt-4 max-w-4xl text-center">
          We had the privilege of collaborating with clients across South
          Florida, including Miami, Fort Lauderdale, Coral Gables, Weston, Boca
          Raton, and Palm Beach.
        </P>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((p, index) => (
          <TransitionLink
            key={p._id}
            href={`/projects/${p.slug}`}
            className="group relative overflow-hidden block project-card-animate"
            style={
              { animationDelay: `${index * 0.12}s` } as React.CSSProperties
            }
            aria-label={`${p.title} — ${p.location}`}>
            <div className="relative w-full aspect-4/3">
              <Image
                src={p.imageUrl}
                alt={p.title}
                priority={index < 3}
                fill
                quality={90}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                style={
                  {
                    viewTransitionName: `hero-${p.slug}`,
                  } as React.CSSProperties
                }
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[hsl(35,15,10)]/55 text-white backdrop-blur-xs">
                <H2 className="text-white transition-all duration-300 ease-out translate-y-[-16px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                  {p.title}
                </H2>
                <P className="text-lg mt-1 transition-all duration-300 ease-out translate-y-[16px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 delay-75">
                  {p.location}
                </P>
              </div>
            </div>
          </TransitionLink>
        ))}
      </div>
    </Main>
  );
}
