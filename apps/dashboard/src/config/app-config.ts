import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Lenis Studio",
  version: packageJson.version,
  copyright: `© ${currentYear}, Lenis Studio.`,
  meta: {
    title: "Lenis Studio",
    description: "Lenis Studio is a modern dashboard built by creatives for creatives. Sorry, accountants.",
  },
  image: {
    src: "/badge.svg",
  },
};
