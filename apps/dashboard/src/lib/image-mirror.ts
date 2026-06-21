import { fetchImageBytes } from "@/server/ai-actions";

const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

export interface MirroredImage {
  url: string;
  path: string;
}

interface MirrorExternalImageOptions {
  url: string;
  upload: (blob: Blob, extension: string) => Promise<MirroredImage>;
  logPrefix: string;
}

export function isFirebaseHosted(url: string): boolean {
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

export async function mirrorExternalImageUrl({
  url,
  upload,
  logPrefix,
}: MirrorExternalImageOptions): Promise<{
  image: MirroredImage;
  mirrored: boolean;
}> {
  const trimmedUrl = url.trim();
  try {
    const res = await fetchImageBytes(trimmedUrl);
    if (res.success && res.base64 && res.contentType) {
      const blob = base64ToBlob(res.base64, res.contentType);
      return {
        image: await upload(blob, extensionForContentType(res.contentType)),
        mirrored: true,
      };
    }
  } catch (error) {
    console.error(`[${logPrefix}] Failed to mirror ${trimmedUrl}:`, error);
  }

  return { image: { url: trimmedUrl, path: "" }, mirrored: false };
}
