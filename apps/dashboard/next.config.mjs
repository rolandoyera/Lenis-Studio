/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    // Enables React's <ViewTransition> integration so route navigations animate
    // shared elements (the auth image/logo) across the home <-> login transition.
    viewTransition: true,
  },
  images: {
    // Hold optimized images (incl. rotating Instagram CDN thumbnails) for 6h so they
    // don't re-optimize on every revisit. Matches the server-side media cache window.
    minimumCacheTTL: 21600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "cdn.weatherapi.com",
      },
      // Instagram media (post images and video thumbnails) served via the Meta CDN.
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/home",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
