import type { Metadata } from "next";
import Footer from "@/components/Footer";
import "./globals.css";
import { Manrope } from "next/font/google";
import Providers from "./Providers";
import Navbar2 from "@/components/Navbar2";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sarviandesign.com"),
  title: {
    default: "Sarvian Design Group",
    template: "Sarvian Design Group | %s  ",
  },
  description:
    "South Florida architecture and interior luxury design studio in Fort Lauderdale and Miami.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <Navbar2 />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
