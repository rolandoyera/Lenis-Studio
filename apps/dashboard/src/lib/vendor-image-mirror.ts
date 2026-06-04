import { uploadVendorImageBlob } from "@/lib/db";
import { fetchImageBytes } from "@/server/ai-actions";

const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

function isFirebaseHosted(url: string): boolean {
  return url.includes(FIREBASE_STORAGE_HOST);
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  return "jpg";
}

function base64ToBlob(base64: string, contentType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

export interface VendorMirrorResult {
  logoUrl: string;
  heroImageUrl: string;
}

/**
 * Mirrors external vendor logo and hero images into Firebase Storage.
 */
export async function mirrorVendorImagesToFirebase(input: {
  logoUrl?: string;
  heroImageUrl?: string;
}): Promise<VendorMirrorResult> {
  const logo = input.logoUrl?.trim() || "";
  const hero = input.heroImageUrl?.trim() || "";

  let resolvedLogo = logo;
  let resolvedHero = hero;

  // Mirror logo if external
  if (logo && !isFirebaseHosted(logo)) {
    try {
      const res = await fetchImageBytes(logo);
      if (res.success && res.base64 && res.contentType) {
        const blob = base64ToBlob(res.base64, res.contentType);
        resolvedLogo = await uploadVendorImageBlob(blob, "logo", extensionForContentType(res.contentType));
      }
    } catch (error) {
      console.error(`[Vendor Mirror] Failed to mirror logo ${logo}:`, error);
    }
  }

  // Mirror hero if external
  if (hero && !isFirebaseHosted(hero)) {
    try {
      const res = await fetchImageBytes(hero);
      if (res.success && res.base64 && res.contentType) {
        const blob = base64ToBlob(res.base64, res.contentType);
        resolvedHero = await uploadVendorImageBlob(blob, "hero", extensionForContentType(res.contentType));
      }
    } catch (error) {
      console.error(`[Vendor Mirror] Failed to mirror hero ${hero}:`, error);
    }
  }

  return { logoUrl: resolvedLogo, heroImageUrl: resolvedHero };
}
