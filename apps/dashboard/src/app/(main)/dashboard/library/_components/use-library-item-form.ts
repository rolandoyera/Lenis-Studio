"use client";

import { useCallback, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { uploadLibraryImage } from "@/lib/db";
import { autofillProductFromUrl } from "@/server/ai-actions";

import { EMPTY_LIBRARY_ITEM_FORM, type LibraryItemFormData, libraryItemSchema } from "./library-constants";

const MAX_IMAGES = 4;
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

  const reset = (values?: Partial<LibraryItemFormData>) =>
    rhfForm.reset({ ...EMPTY_LIBRARY_ITEM_FORM, ...values });

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
    try {
      const res = await autofillProductFromUrl(url);
      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to extract product specs from the link.", { duration: 8000 });
        return;
      }

      const ext = res.data;

      setFormData((prev) => {
        const newImages = [...(prev.imageUrls ?? [])];
        if (ext.imageUrls && ext.imageUrls.length > 0) {
          for (const img of ext.imageUrls) {
            if (!newImages.includes(img) && newImages.length < 4) {
              newImages.push(img);
            }
          }
        }

        const updated = {
          ...prev,
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
          coverImageUrl: prev.coverImageUrl || newImages[0] || "",
          aiMetadata: {
            sourceUrl: url,
            importedAt: Date.now(),
            model: "gemini-2.5-flash",
            confidence: ext.confidence,
            rawExtraction: ext.rawExtraction,
          },
        };

        const sellingPrice = Number((prev.unitCost * (1 + prev.markup / 100)).toFixed(2));
        return { ...updated, sellingPrice };
      });

      toast.success("Product specs successfully autofilled with AI (Review before saving)!");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error(errMsg || "An unexpected error occurred during autofill.", { duration: 8000 });
    } finally {
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

  const setAsCover = (url: string) => {
    setFormData((prev) => ({ ...prev, coverImageUrl: url }));
    toast.success("Primary cover image updated!");
  };

  const removeImageUrl = (url: string) => {
    setFormData((prev) => {
      const filtered = (prev.imageUrls ?? []).filter((u) => u !== url);
      return {
        ...prev,
        imageUrls: filtered,
        coverImageUrl: prev.coverImageUrl === url ? filtered[0] || "" : prev.coverImageUrl,
      };
    });
  };

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
    removeImageUrl,
  };
}

export type LibraryItemFormApi = ReturnType<typeof useLibraryItemForm>;
