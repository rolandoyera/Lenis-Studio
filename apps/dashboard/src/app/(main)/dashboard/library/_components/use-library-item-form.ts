"use client";

import { useCallback, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { startLunaProductAutofillToast } from "@/components/luna-progress-toast";
import { AI_ASSISTANT_NAME } from "@/lib/ai-assistant";
import { runAiActionWithRetry } from "@/lib/ai-retry";
import { uploadLibraryImage } from "@/lib/db";
import { autofillProductFromUrl } from "@/server/ai-actions";

import { EMPTY_LIBRARY_ITEM_FORM, type LibraryItemFormData, libraryItemSchema, MAX_IMAGES } from "./library-constants";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function useLibraryItemForm() {
  const rhfForm = useForm<LibraryItemFormData>({
    resolver: zodResolver(libraryItemSchema) as any,
    defaultValues: EMPTY_LIBRARY_ITEM_FORM,
  });

  // Reactive form data — replaces useState<LibraryItemFormData>
  const formData = rhfForm.watch();

  // Compatibility setter: mirrors the previous useState pattern so the dialog
  // doesn't need wholesale rewrites on every field.
  const setFormData = useCallback(
    (updater: LibraryItemFormData | ((prev: LibraryItemFormData) => LibraryItemFormData)) => {
      const current = rhfForm.getValues();
      const next = typeof updater === "function" ? updater(current) : updater;
      (Object.keys(next) as (keyof LibraryItemFormData)[]).forEach((key) => {
        rhfForm.setValue(key, next[key] as any, { shouldDirty: true });
      });
    },
    [rhfForm],
  );

  // Bridges formatted price display <-> raw keystrokes for the focused price input.
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [tempTextValue, setTempTextValue] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const reset = useCallback(
    (values?: Partial<LibraryItemFormData>) => rhfForm.reset({ ...EMPTY_LIBRARY_ITEM_FORM, ...values }),
    [rhfForm],
  );

  // Wraps RHF's handleSubmit so the dialog can call form.handleSubmit(onSubmit)
  // where onSubmit is a simple no-arg async function from the page.
  const handleSubmit = useCallback(
    (onValid: () => void | Promise<void>) =>
      rhfForm.handleSubmit(async () => {
        await onValid();
      }),
    [rhfForm],
  );

  const updatePricing = (unitCost: number, markup: number, msrp: number) => {
    const sellingPrice = Number((unitCost * (1 + markup / 100)).toFixed(2));
    setFormData((prev) => ({ ...prev, unitCost, markup, msrp, sellingPrice }));
  };

  const setSellingPrice = (value: number) => {
    setFormData((prev) => {
      const markup =
        prev.unitCost > 0 ? Number((((value - prev.unitCost) / prev.unitCost) * 100).toFixed(2)) : prev.markup;
      return { ...prev, sellingPrice: value, markup };
    });
  };

  const autofillWithAi = async () => {
    const url = formData.sourcingLink;
    if (!url || url.trim() === "") {
      toast.error("Please enter a product web link first.", { duration: 8000 });
      return;
    }

    setAiLoading(true);
    const lunaToast = startLunaProductAutofillToast();
    try {
      const res = await runAiActionWithRetry(() => autofillProductFromUrl(url), {
        toastId: lunaToast.id,
        onRetry: lunaToast.showRetry,
      });
      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to extract product specs from the link.", {
          id: lunaToast.id,
          duration: 8000,
        });
        return;
      }

      const ext = res.data;

      setFormData((prev) => {
        // Re-scraping replaces only the AI-sourced images and KEEPS manual uploads.
        // Manual uploads are tracked in manualImageUrls (always Firebase-hosted, never
        // changed by mirroring), so they're a stable anchor: we preserve those and swap
        // out the rest for the freshly scraped set. Appending instead piled up duplicates,
        // because a saved item's AI images are Firebase-mirrored copies of the very photos
        // the scraper returns again as raw vendor URLs (same picture, different string).
        const prevImages = prev.imageUrls ?? [];
        const manualImages = (prev.manualImageUrls ?? []).filter((u) => prevImages.includes(u));

        const aiImages: string[] = [];
        const seen = new Set<string>(manualImages);
        for (const img of ext.imageUrls ?? []) {
          const url = img.trim();
          if (!url || seen.has(url) || manualImages.length + aiImages.length >= MAX_IMAGES) continue;
          seen.add(url);
          aiImages.push(url);
        }

        // Only swap the AI portion when the scrape actually returned images.
        const newImages = aiImages.length > 0 ? [...manualImages, ...aiImages] : prevImages;
        const coverImageUrl =
          prev.coverImageUrl && newImages.includes(prev.coverImageUrl) ? prev.coverImageUrl : (newImages[0] ?? "");

        const updated = {
          ...prev,
          manualImageUrls: manualImages,
          name: ext.name || prev.name,
          sku: ext.sku || prev.sku,
          category: ext.category || prev.category,
          description: ext.description || prev.description,
          finishColor: ext.finishColor || prev.finishColor,
          manufacturer: ext.manufacturer || prev.manufacturer,
          materials: ext.materials || prev.materials,
          dimensions: ext.dimensions || prev.dimensions,
          sourcingLink: prev.sourcingLink || url,
          msrp: ext.msrp !== undefined && ext.msrp > 0 ? ext.msrp : prev.msrp,
          imageUrls: newImages,
          coverImageUrl,
          aiMetadata: {
            sourceUrl: url,
            importedAt: Date.now(),
            model: res.modelUsed || "gemini-3.5-flash",
            confidence: ext.confidence,
          },
        };

        const sellingPrice = Number((prev.unitCost * (1 + prev.markup / 100)).toFixed(2));
        return { ...updated, sellingPrice };
      });

      toast.success(`Product specs successfully filled with ${AI_ASSISTANT_NAME} (Review before saving)!`, {
        id: lunaToast.id,
        duration: 5000,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "An unexpected error occurred during autofill.", {
        id: lunaToast.id,
        duration: 8000,
      });
    } finally {
      lunaToast.stop();
      setAiLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image size exceeds 5MB limit.", { duration: 8000 });
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadLibraryImage(file);
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...(prev.imageUrls ?? []), url].slice(0, MAX_IMAGES),
        // Record this as a manual upload so AI re-scrapes never remove it.
        manualImageUrls: [...(prev.manualImageUrls ?? []), url],
        coverImageUrl: prev.coverImageUrl || url,
      }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image.", { duration: 8000 });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const setAsCover = useCallback(
    (url: string) => {
      setFormData((prev) => {
        const urls = prev.imageUrls ?? [];
        const index = urls.indexOf(url);
        if (index <= 0) return prev;
        const nextUrls = [url, ...urls.filter((u) => u !== url)];
        return {
          ...prev,
          imageUrls: nextUrls,
          coverImageUrl: url,
        };
      });
      toast.success("Image moved to cover (first slot)!");
    },
    [setFormData],
  );

  const reorderImages = useCallback(
    (sourceIndex: number, targetIndex: number) => {
      setFormData((prev) => {
        const urls = [...(prev.imageUrls ?? [])];
        if (sourceIndex < 0 || sourceIndex >= urls.length || targetIndex < 0 || targetIndex >= urls.length) {
          return prev;
        }
        const [removed] = urls.splice(sourceIndex, 1);
        urls.splice(targetIndex, 0, removed);
        return {
          ...prev,
          imageUrls: urls,
          coverImageUrl: urls[0] ?? "",
        };
      });
    },
    [setFormData],
  );

  const removeImageUrl = useCallback(
    (url: string) => {
      setFormData((prev) => {
        const filtered = (prev.imageUrls ?? []).filter((u) => u !== url);
        return {
          ...prev,
          imageUrls: filtered,
          manualImageUrls: (prev.manualImageUrls ?? []).filter((u) => u !== url),
          coverImageUrl: filtered[0] || "",
        };
      });
    },
    [setFormData],
  );

  return {
    formData,
    setFormData,
    setValue: rhfForm.setValue,
    reset,
    control: rhfForm.control,
    formState: rhfForm.formState,
    handleSubmit,
    focusedField,
    setFocusedField,
    tempTextValue,
    setTempTextValue,
    uploadingImage,
    aiLoading,
    updatePricing,
    setSellingPrice,
    autofillWithAi,
    handleImageUpload,
    setAsCover,
    reorderImages,
    removeImageUrl,
  };
}

export type LibraryItemFormApi = ReturnType<typeof useLibraryItemForm>;
