"use client";

import { CSSProperties, MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { urlFor, type SanityImageWithAlt } from "@/sanity/lib/image";
import ArrowButton from "./ui/ArrowButton";

interface NextProjectProps {
  prevProject?: {
    title: string;
    slug: string;
    mainImage?: SanityImageWithAlt | null;
  } | null;
  nextProject?: {
    title: string;
    slug: string;
    mainImage?: SanityImageWithAlt | null;
  } | null;
}

export default function NextPrevious({
  prevProject,
  nextProject,
}: NextProjectProps) {
  const router = useRouter();

  const prevImageSrc = prevProject?.mainImage
    ? urlFor(prevProject.mainImage).width(1280).height(720).auto("format").url()
    : null;

  const nextImageSrc = nextProject?.mainImage
    ? urlFor(nextProject.mainImage).width(1280).height(720).auto("format").url()
    : null;

  const handleTransitionClick = (
    e: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();

    if (!(document as any).startViewTransition) {
      router.push(href);
      return;
    }

    (document as any).startViewTransition(() => {
      return new Promise<void>((resolve) => {
        router.push(href);

        const observer = new MutationObserver(() => {
          observer.disconnect();
          resolve();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 1500);
      });
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 my-40 px-6 xl:px-6">
      <style dangerouslySetInnerHTML={{ __html: `
        ::view-transition-old(root) {
          animation: 250ms cubic-bezier(0.4, 0, 1, 1) both fade-out !important;
        }
        ::view-transition-new(root) {
          animation: 300ms cubic-bezier(0, 0, 0.2, 1) both fade-in !important;
          animation-delay: 250ms !important;
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
      {prevProject && (
        <div className="relative w-full aspect-16/6 overflow-hidden rounded shadow bg-neutral-900 [&_.card-overlay]:has-[a:hover]:bg-black/55">
          {prevImageSrc ? (
            <Image
              src={prevImageSrc}
              alt={prevProject.mainImage?.alt || prevProject.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 50vw"
              style={
                { viewTransitionName: `hero-${prevProject.slug}` } as CSSProperties
              }
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-neutral-800 to-neutral-900 fallback-bg" />
          )}

          {/* Centered Overlay Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/45 transition-colors duration-300 p-6 text-center card-overlay">
            <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight max-w-md line-clamp-2">
              {prevProject.title}
            </h3>
            <ArrowButton
              href={`/projects/${prevProject.slug}`}
              direction="left"
              variant="secondary"
              className="bg-white text-foreground hover:bg-accent hover:text-white"
              onClick={(e) =>
                handleTransitionClick(e, `/projects/${prevProject.slug}`)
              }>
              Previous
            </ArrowButton>
          </div>
        </div>
      )}

      {nextProject && (
        <div className="relative w-full aspect-16/6 overflow-hidden rounded shadow bg-neutral-900 [&_.card-overlay]:has-[a:hover]:bg-black/55">
          {nextImageSrc ? (
            <Image
              src={nextImageSrc}
              alt={nextProject.mainImage?.alt || nextProject.title}
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 50vw"
              style={
                { viewTransitionName: `hero-${nextProject.slug}` } as CSSProperties
              }
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-neutral-800 to-neutral-900 fallback-bg" />
          )}

          {/* Centered Overlay Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/45 transition-colors duration-300 p-6 text-center card-overlay">
            <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight max-w-md line-clamp-2">
              {nextProject.title}
            </h3>
            <ArrowButton
              href={`/projects/${nextProject.slug}`}
              variant="secondary"
              className="bg-white text-foreground hover:bg-accent hover:text-white"
              onClick={(e) =>
                handleTransitionClick(e, `/projects/${nextProject.slug}`)
              }>
              Next
            </ArrowButton>
          </div>
        </div>
      )}
    </div>
  );
}
