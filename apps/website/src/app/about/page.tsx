import type { Metadata } from "next";
import AboutContent from "./about-content";

export const metadata: Metadata = {
  title: "About Sarvian Design Group",
  description: "Learn more about SDG and our mission.",
  openGraph: {
    title: "About Sarvian Design Group",
    description: "Learn more about SDG and our mission.",
    url: "https://sarviandg.com/about",
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
