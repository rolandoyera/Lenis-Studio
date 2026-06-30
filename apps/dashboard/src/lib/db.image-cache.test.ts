import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Firebase so importing db.ts neither initializes the real app nor hits the
// network. We capture what the upload helpers hand to `uploadBytes`/`ref`.
vi.mock("@/lib/firebase", () => ({ db: {}, storage: {} }));
vi.mock("@/lib/db-trace", () => ({
  trace: (
    _collection: string,
    _op: string,
    _name: string,
    fn: () => unknown,
  ) => fn(),
}));
vi.mock("firebase/storage", () => ({
  ref: vi.fn((_storage: unknown, path: string) => ({ _path: path })),
  uploadBytes: vi.fn(async (storageRef: { _path: string }) => ({
    ref: storageRef,
  })),
  getDownloadURL: vi.fn(
    async (storageRef: { _path: string }) =>
      `https://firebasestorage.googleapis.com/${storageRef._path}?alt=media&token=tok`,
  ),
  deleteObject: vi.fn(async () => undefined),
}));

import { ref, uploadBytes } from "firebase/storage";

import {
  uploadLibraryImage,
  uploadLibraryImageBlob,
  uploadOrgBrandingImage,
  uploadVendorImage,
  uploadVendorImageBlob,
} from "@/lib/db";

// Must match IMMUTABLE_MEDIA_CACHE in db.ts. This is the freshness contract:
// a year, immutable — safe only because every changed image gets a new URL.
const IMMUTABLE = "public, max-age=31536000, immutable";

/** The metadata object passed as the 3rd arg of the first uploadBytes call. */
function uploadedMetadata(): { cacheControl?: string; contentType?: string } {
  const call = vi.mocked(uploadBytes).mock.calls[0];
  return (call?.[2] ?? {}) as { cacheControl?: string; contentType?: string };
}

/** The storage path passed to the first ref() call. */
function uploadedPath(): string {
  return vi.mocked(ref).mock.calls[0]?.[1] as string;
}

const file = () =>
  new File([new Uint8Array([1, 2, 3])], "photo.jpg", { type: "image/jpeg" });
const blob = () => new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("storage uploads set an immutable cache header", () => {
  it("uploadLibraryImage", async () => {
    await uploadLibraryImage("org1", file(), "item1");
    expect(uploadedMetadata().cacheControl).toBe(IMMUTABLE);
  });

  it("uploadLibraryImageBlob", async () => {
    await uploadLibraryImageBlob("org1", blob(), "item1");
    expect(uploadedMetadata().cacheControl).toBe(IMMUTABLE);
  });

  it("uploadVendorImage", async () => {
    await uploadVendorImage("org1", file(), "logo", "vendor1");
    expect(uploadedMetadata().cacheControl).toBe(IMMUTABLE);
  });

  it("uploadVendorImageBlob", async () => {
    await uploadVendorImageBlob("org1", blob(), "logo", "vendor1");
    expect(uploadedMetadata().cacheControl).toBe(IMMUTABLE);
  });

  it("uploadOrgBrandingImage", async () => {
    await uploadOrgBrandingImage(file(), "logo", "org1");
    expect(uploadedMetadata().cacheControl).toBe(IMMUTABLE);
  });
});

describe("library blob uploads use the unified images/ path", () => {
  it("writes to images/{id}, never a separate cover.{ext} file", async () => {
    await uploadLibraryImageBlob("org1", blob(), "item1");
    const path = uploadedPath();
    expect(path).toMatch(/^library\/org1\/item1\/images\/.+\.jpg$/);
    expect(path).not.toContain("/cover.");
  });

  it("honors an explicit imageId and extension", async () => {
    await uploadLibraryImageBlob("org1", blob(), "item1", "img-fixed", "png");
    expect(uploadedPath()).toBe("library/org1/item1/images/img-fixed.png");
  });
});
