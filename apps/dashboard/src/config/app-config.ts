import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Sarvian Design Group",
  version: packageJson.version,
  copyright: `© ${currentYear}, SDG.`,
  meta: {
    title: "Sarvian Design Group",
    description:
      "SDG is a modern dashboard template for Sarvian Design Group built with Next.js 16, Tailwind CSS v4, and shadcn/ui.",
  },
};
