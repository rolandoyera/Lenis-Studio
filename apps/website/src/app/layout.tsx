import type { Metadata } from "next";
import Footer from "@/components/Footer";
import "./globals.css";
import { Manrope } from "next/font/google";
import Providers from "./Providers";
import Navbar from "@/components/Navbar";
import Script from "next/script";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sarviandesign.com"),
  title: "Sarvian Design Group",
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
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
