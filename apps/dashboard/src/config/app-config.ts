import packageJson from "../../package.json";

export interface AppBrand {
  name: string;
  shortName: string;
  tagline: string;
  meta: {
    title: string;
    description: string;
  };
  image: {
    src: string;
    darkSrc: string;
    iconSrc: string;
    iconDarkSrc: string;
    invertOnDark?: boolean;
  };
}

const defaultBrand: AppBrand = {
  name: "Lenis Studio",
  shortName: "Lenis Studio",
  tagline: "Design. Build. Repeat.",
  meta: {
    title: "Lenis Studio",
    description:
      "Lenis Studio is a modern dashboard built by creatives for creatives. Sorry, accountants.",
  },
  image: {
    src: "/badge.svg",
    darkSrc: "/badge.svg",
    iconSrc: "/badge.svg",
    iconDarkSrc: "/badge.svg",
    invertOnDark: true,
  },
};

const sarvianBrand: AppBrand = {
  name: "Sarvian Design Group",
  shortName: "Sarvian Studio",
  tagline: "Design. Build. Repeat.",
  meta: {
    title: "Sarvian Design Group",
    description: "Sarvian Design Group dashboard.",
  },
  image: {
    src: "/brands/app.sarviandg.com/logo-dark.svg",
    darkSrc: "/brands/app.sarviandg.com/logo-light.svg",
    iconSrc: "/brands/app.sarviandg.com/icon-dark.svg",
    iconDarkSrc: "/brands/app.sarviandg.com/icon-light.svg",
  },
};

export const APP_CONFIG = {
  version: packageJson.version,
  brand: defaultBrand,
  hostBrands: {
    "app.sarviandg.com": sarvianBrand,
    "app.sarviandg.local": sarvianBrand,
  },
} satisfies {
  version: string;
  brand: AppBrand;
  hostBrands: Record<string, AppBrand>;
};

export function resolveAppBrand(host?: string | null): AppBrand {
  const normalizedHost = host?.split(":")[0]?.toLowerCase();
  const hostBrands: Record<string, AppBrand> = APP_CONFIG.hostBrands;

  if (normalizedHost && hostBrands[normalizedHost]) {
    return hostBrands[normalizedHost];
  }

  return APP_CONFIG.brand;
}
