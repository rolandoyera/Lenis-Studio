import type { Metadata } from "next";
import AboutContent from "./about-content";

export const metadata: Metadata = {
  title: "About | SDG",
  description: "Learn more about SDG and our mission.",
  openGraph: {
    title: "About | SDG",
    description: "Learn more about SDG and our mission.",
    url: "https://your-domain.com/about",
    siteName: "SDG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About | SDG",
    description: "Learn more about SDG and our mission.",
  },
};

export default function AboutPage() {
  return <AboutContent />;
}
