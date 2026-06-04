import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Studio Dezien",
  version: packageJson.version,
  copyright: `© ${currentYear}, Dezien CRM.`,
  meta: {
    title: "Studio Dezien",
    description:
      "Dezien CRM is a modern dashboard built by creatives for creatives. Sorry, accountants.",
  },
};
