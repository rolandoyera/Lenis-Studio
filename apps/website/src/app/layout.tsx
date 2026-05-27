import type { Metadata } from "next";
import Footer from "@/components/Footer";
import "./globals.css";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import Providers from "./Providers";
import Navbar2 from "@/components/Navbar2";
import Script from "next/script";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
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
        className={`${manrope.variable} ${ibmPlexMono.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-K0ZYTV5JSM"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-K0ZYTV5JSM');
            `}
          </Script>
          <Navbar2 />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
