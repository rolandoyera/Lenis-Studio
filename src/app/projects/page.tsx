// app/projects/page.tsx
import Image from "next/image";
import Link from "next/link";
import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";
import Main from "@/components/ui/Main";
import Container from "@/components/ui/Container";
import H1 from "@/components/ui/H1";
import H2 from "@/components/ui/H2";

export const revalidate = 60; // Revalidate the page every 60 seconds

const QUERY = groq`
  *[_type == "project" && defined(mainImage)]{
    _id,
    title,
    location,
    "slug": slug.current,
    "imageUrl": mainImage.asset->url
  } | order(_createdAt desc)
`;

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
    <Main className="px-8">
      <div className="w-full flex flex-col items-center justify-center py-20">
        <H1>Latest Projects</H1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl text-center">We had the privilege of collaborating with clients across South Florida, including Miami, Fort Lauderdale, Coral Gables, Weston, Boca Raton, and Palm Beach.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {projects.map((p, index) => (
          <Link
            key={p._id}
            href={`/projects/${p.slug}`}
            className="group relative overflow-hidden block"
            aria-label={`${p.title} — ${p.location}`}>
            <div className="relative w-full aspect-4/3">
              <Image
                src={p.imageUrl}
                alt={p.title}
                priority={index < 2}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-info/55 text-white backdrop-blur-md">
                <H2 className="text-white">{p.title}</H2>
                <p className="text-lg mt-1">{p.location}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </Main>
  );
}
