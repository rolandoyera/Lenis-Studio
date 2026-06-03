import { uploadLibraryImageBlob } from "@/lib/db";
import { fetchImageBytes } from "@/server/ai-actions";

/** Firebase Storage download URLs live on this host; images already here are left untouched. */
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

export interface MirrorResult {
  imageUrls: string[];
  coverImageUrl: string;
  /** How many external images were successfully copied into Firebase Storage. */
  mirroredCount: number;
  /** How many external images could not be fetched and kept their original URL. */
  failedCount: number;
}

/**
 * Mirrors any external (non-Firebase) image URLs on a library item into Firebase
 * Storage so saved items never hotlink to vendor CDNs (which can rot, 403, or change).
 * Each external URL is fetched server-side (to bypass CORS) and re-uploaded via the
 * client SDK. Images that fail to fetch keep their original URL — we never drop one.
 * Firebase-hosted URLs (e.g. manual uploads) are passed through unchanged.
 */
export async function mirrorExternalImagesToFirebase(input: {
  imageUrls?: string[];
  coverImageUrl?: string;
}): Promise<MirrorResult> {
  const originalImages = (input.imageUrls ?? []).filter(Boolean);
  const cover = input.coverImageUrl?.trim() || "";

  // Unique set of external URLs that actually need mirroring (images + cover).
  const candidates = new Set<string>(originalImages);
  if (cover) candidates.add(cover);
  const externals = [...candidates].filter((url) => !isFirebaseHosted(url));

  // external URL -> resolved URL (Firebase on success, original on failure)
  const mapping = new Map<string, string>();
  let mirroredCount = 0;
  let failedCount = 0;

  await Promise.all(
    externals.map(async (url) => {
      try {
        const res = await fetchImageBytes(url);
        if (res.success && res.base64 && res.contentType) {
          const blob = base64ToBlob(res.base64, res.contentType);
          const firebaseUrl = await uploadLibraryImageBlob(blob, extensionForContentType(res.contentType));
          mapping.set(url, firebaseUrl);
          mirroredCount++;
          return;
        }
      } catch (error) {
        console.error(`[Image Mirror] Failed to mirror ${url}:`, error);
      }
      // Keep the original external URL on any failure.
      mapping.set(url, url);
      failedCount++;
    }),
  );

  const resolve = (url: string) => mapping.get(url) ?? url;
  const imageUrls = originalImages.map(resolve);
  const coverImageUrl = cover ? resolve(cover) : (imageUrls[0] ?? "");

  return { imageUrls, coverImageUrl, mirroredCount, failedCount };
}
