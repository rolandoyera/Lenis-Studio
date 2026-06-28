import { uploadVendorImageBlob } from "@/lib/db";
import { isFirebaseHosted, mirrorExternalImageUrl } from "@/lib/image-mirror";

export interface VendorMirrorResult {
  logoUrl: string;
  logoPath?: string;
  heroImageUrl: string;
  heroImagePath?: string;
}

/**
 * Mirrors external vendor logo and hero images into Firebase Storage.
 */
export async function mirrorVendorImagesToFirebase(
  organizationId: string,
  input: {
    logoUrl?: string;
    logoPath?: string;
    heroImageUrl?: string;
    heroImagePath?: string;
  },
  vendorId: string,
): Promise<VendorMirrorResult> {
  const logo = input.logoUrl?.trim() || "";
  const hero = input.heroImageUrl?.trim() || "";

  let resolvedLogo = logo;
  let logoPath = input.logoPath ?? "";
  let resolvedHero = hero;
  let heroImagePath = input.heroImagePath ?? "";

  // Mirror logo if external
  if (logo && !isFirebaseHosted(logo)) {
    const result = await mirrorExternalImageUrl({
      url: logo,
      upload: (blob, extension) =>
        uploadVendorImageBlob(organizationId, blob, "logo", vendorId, extension),
      logPrefix: "Vendor Mirror",
    });
    if (result.mirrored) {
      resolvedLogo = result.image.url;
      logoPath = result.image.path;
    }
  }

  // Mirror hero if external
  if (hero && !isFirebaseHosted(hero)) {
    const result = await mirrorExternalImageUrl({
      url: hero,
      upload: (blob, extension) =>
        uploadVendorImageBlob(organizationId, blob, "hero", vendorId, extension),
      logPrefix: "Vendor Mirror",
    });
    if (result.mirrored) {
      resolvedHero = result.image.url;
      heroImagePath = result.image.path;
    }
  }

  return {
    logoUrl: resolvedLogo,
    logoPath,
    heroImageUrl: resolvedHero,
    heroImagePath,
  };
}
