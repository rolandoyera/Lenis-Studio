import OurApproachSection from "@/components/Approach";
import Carousel from "@/components/Carousel";
import Connect from "@/components/Connect";
import TopSection from "@/components/TopSection";
import type { Metadata } from "next";
import { groq } from "next-sanity";
import { client } from "@/sanity/lib/client";

export const metadata: Metadata = {
  title: "Fort Lauderdale & Miami Interior Design",
  description:
    "Sarvian Design delivers Fort Lauderdale interior design, Miami interior design, and South Florida architecture.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Fort Lauderdale & Miami Interior Design | Sarvian Design Group",
    description:
      "Sarvian Design delivers Fort Lauderdale interior design, Miami interior design, and South Florida architecture.",
    url: "https://www.sarviandesign.com/",
    siteName: "Sarvian Design Group",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fort Lauderdale & Miami Interior Design",
    description:
      "Sarvian Design delivers Fort Lauderdale interior design, Miami interior design, and South Florida architecture.",
  },
};

interface CarouselItem {
  id: string | number;
  image: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  onButtonClick?: () => void;
}

const FALLBACK_SLIDER_ITEMS: CarouselItem[] = [
  {
    id: 1,
    image: "/slider/South-Beach-Living-Interior-Design.jpg",
    title: "South Beach Living",
    description: "Stunning sunset over the ocean waves",
    buttonText: "Explore Now",
    buttonLink: "/projects/south-beach",
  },
  {
    id: 2,
    image: "/projects/golden-beach-architecture-proposal-front-view.jpg",
    title: "Golden Dreams",
    description: "Sunlit luxury meets serene modern design",
    buttonText: "Explore Now",
    buttonLink: "/projects/golden-beach",
  },
  {
    id: 3,
    image: "/slider/aventura-interior-design.jpg",
    title: "Aventura",
    description: "Sunlit luxury meets serene modern design",
    buttonText: "Explore Now",
    buttonLink: "/projects/aventura-modern-living",
  },
];

const QUERY = groq`
  *[_type == "slide"] | order(coalesce(order, 0) asc, _createdAt desc){
    "id": _id,
    "image": image.asset->url,
    title,
    description,
    buttonText,
    "buttonLink": select(
      defined(project) => "/projects/" + project->slug.current,
      "/"
    )
  }
`;

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let sliderItems: CarouselItem[] = [];

  try {
    sliderItems = await client.fetch(QUERY);
  } catch (error) {
    console.error("Failed to fetch homepage slides:", error);
  }

  // Fallback to local slides if Sanity doesn't return any slides yet
  if (!sliderItems || sliderItems.length === 0) {
    sliderItems = FALLBACK_SLIDER_ITEMS;
  }

  return (
    <>
      <Carousel items={sliderItems} autoPlayInterval={5000} showArrows={true} />

      <section className="min-h-dvh p-6 xl:p-0">
        <TopSection />
      </section>
      {/* <section className="min-h-dvh">
        <OurApproachSection />
      </section> */}

      <Connect />
    </>
  );
}
