"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Image, Loader2, Upload } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import LunaMoon from "@/components/LunaMoon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AI_ASSISTANT_NAME } from "@/lib/ai-assistant";
import { runAiActionWithRetry } from "@/lib/ai-retry";
import { uploadVendorImage } from "@/lib/db";
import { formatPhone, formatZip } from "@/lib/utils";
import { autofillVendorFromUrl } from "@/server/ai-actions";

import {
  cleanTrailingSlash,
  EMPTY_VENDOR_FORM,
  VENDOR_CATEGORIES,
  type VendorFormData,
  vendorSchema,
  vendorToForm,
} from "./vendor-constants";

export {
  cleanTrailingSlash,
  EMPTY_VENDOR_FORM,
  VENDOR_CATEGORIES,
  type VendorFormData,
  vendorSchema,
  vendorToForm,
};

const LABEL_CLASS = "h-5 flex items-center";

// ─── Image Picker ─────────────────────────────────────────────────────────────

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  logoCandidates: string[];
  imageCandidates: string[];
  onApply: (logo: string | null, hero: string | null) => void;
}

function ImagePickerDialog({
  open,
  onOpenChange,
  logoCandidates,
  imageCandidates,
  onApply,
}: ImagePickerDialogProps) {
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [selectedHero, setSelectedHero] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedLogo(null);
      setSelectedHero(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover/95 backdrop-blur-md sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Select Brand Images</DialogTitle>
          <DialogDescription>
            {AI_ASSISTANT_NAME} has found more than one image candidate for this
            vendor. Please review and select the best Logo and Main Showcase
            Image from the options below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto px-0.5 py-1">
          {logoCandidates.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className={LABEL_CLASS}>Logo</p>
              <div className="grid grid-cols-4 gap-2">
                {logoCandidates.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() =>
                      setSelectedLogo(url === selectedLogo ? null : url)
                    }
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-muted/30 transition-all ${
                      selectedLogo === url
                        ? "border-primary shadow-md"
                        : "border-border hover:border-muted-foreground/40"
                    }`}>
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-contain p-2"
                      onError={(e) => {
                        (
                          e.currentTarget.parentElement as HTMLElement
                        ).style.display = "none";
                      }}
                    />
                    {selectedLogo === url && (
                      <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary">
                        <Check className="size-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {imageCandidates.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className={LABEL_CLASS}>Main Image</p>
              <div className="grid grid-cols-3 gap-2">
                {imageCandidates.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() =>
                      setSelectedHero(url === selectedHero ? null : url)
                    }
                    className={`relative aspect-video overflow-hidden rounded-lg border-2 bg-muted/30 transition-all ${
                      selectedHero === url
                        ? "border-primary shadow-md"
                        : "border-border hover:border-muted-foreground/40"
                    }`}>
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (
                          e.currentTarget.parentElement as HTMLElement
                        ).style.display = "none";
                      }}
                    />
                    {selectedHero === url && (
                      <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary">
                        <Check className="size-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(selectedLogo, selectedHero);
              onOpenChange(false);
            }}>
            Apply Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vendor Form Dialog ───────────────────────────────────────────────────────

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: VendorFormData;
  onSave: (data: VendorFormData) => Promise<void>;
}

export function VendorFormDialog({
  open,
  onOpenChange,
  mode,
  initialData,
  onSave,
}: VendorFormDialogProps) {
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: initialData ?? EMPTY_VENDOR_FORM,
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    setValue,
    watch,
    getValues,
  } = form;

  const [aiLoading, setAiLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerData, setPickerData] = useState<{
    logoCandidates: string[];
    imageCandidates: string[];
  }>({ logoCandidates: [], imageCandidates: [] });

  const logoUrlValue = watch("logoUrl");
  const heroImageUrlValue = watch("heroImageUrl");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image size exceeds 5MB limit.", { duration: 8000 });
      e.target.value = "";
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadVendorImage(file, "logo");
      setValue("logoUrl", url);
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image size exceeds 5MB limit.", { duration: 8000 });
      e.target.value = "";
      return;
    }
    setUploadingHero(true);
    try {
      const url = await uploadVendorImage(file, "hero");
      setValue("heroImageUrl", url);
      toast.success("Showcase image uploaded successfully!");
    } catch (error) {
      console.error("Hero upload error:", error);
      toast.error("Failed to upload showcase image.");
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (open) reset(initialData ?? EMPTY_VENDOR_FORM);
  }, [open, initialData, reset]);

  const handleEnrich = async () => {
    const url = getValues("website");
    if (!url) return;
    setAiLoading(true);
    const toastId = toast.loading(
      `${AI_ASSISTANT_NAME} is analyzing the vendor site…`,
    );
    try {
      const result = await runAiActionWithRetry(
        () => autofillVendorFromUrl(url),
        { toastId },
      );
      if (result.success && result.data) {
        const d = result.data;
        if (d.name) setValue("name", d.name);
        if (d.category) setValue("category", d.category);
        if (d.description) setValue("description", d.description);
        if (d.street) setValue("street", d.street);
        if (d.city) setValue("city", d.city);
        if (d.state) setValue("state", d.state);
        if (d.zip) setValue("zip", d.zip);
        if (d.repPhone) setValue("repPhone", formatPhone(d.repPhone));
        if (d.repEmail) setValue("repEmail", d.repEmail);
        if (d.logoUrl) setValue("logoUrl", d.logoUrl);
        if (d.heroImageUrl) setValue("heroImageUrl", d.heroImageUrl);
        if (d.instagram) setValue("instagram", d.instagram);
        if (d.pinterest) setValue("pinterest", d.pinterest);
        if (d.facebook) setValue("facebook", d.facebook);
        if (d.youtube) setValue("youtube", d.youtube);
        if (d.xTwitter) setValue("xTwitter", d.xTwitter);

        if (d.logoCandidates?.length || d.imageCandidates?.length) {
          setPickerData({
            logoCandidates: d.logoCandidates ?? [],
            imageCandidates: d.imageCandidates ?? [],
          });
          if (d.showImagePicker) {
            setPickerOpen(true);
          }
        }

        toast.success(
          `Vendor enriched with ${AI_ASSISTANT_NAME} — please review the fields.`,
          {
            id: toastId,
          },
        );
      } else {
        toast.error(result.error ?? "Failed to enrich vendor.", {
          id: toastId,
        });
      }
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: VendorFormData) => {
    await onSave(data);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!isSubmitting && !aiLoading) onOpenChange(v);
        }}>
        <DialogContent className="bg-popover/95 backdrop-blur-md sm:max-w-3xl">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
            autoComplete="off">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {mode === "edit" ? "Edit Vendor" : "Add Vendor"}
              </DialogTitle>
              <DialogDescription>
                Input sourcing details, vendor contacts, and designer
                procurement notes.
              </DialogDescription>
            </DialogHeader>

            <div className="-mr-4 flex max-h-[65vh] flex-col gap-4 overflow-y-auto py-2 pr-4 pl-0.5">
              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field
                      className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>
                        Name <span className="ml-0.5 text-destructive">*</span>
                      </Label>
                      <Input
                        {...field}
                        placeholder="e.g. Arteriors, RH"
                        aria-invalid={fieldState.invalid}
                        autoComplete="one-time-code"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <Field
                      className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Category</Label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}>
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {VENDOR_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Website + Enrich button */}
              <Controller
                control={control}
                name="website"
                render={({ field, fieldState }) => (
                  <Field
                    className="flex flex-col gap-1.5"
                    data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Website</Label>
                    <div className="flex gap-2">
                      <Input
                        {...field}
                        placeholder="www.arteriorshome.com"
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                        autoComplete="one-time-code"
                        onBlur={(e) => {
                          field.onBlur();
                          field.onChange(cleanTrailingSlash(e.target.value));
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleEnrich}
                        disabled={
                          !field.value || aiLoading ? true : isSubmitting
                        }
                        className="group relative h-10 shrink-0 cursor-pointer overflow-hidden border-0 bg-linear-to-r from-violet-600 to-indigo-500 px-3 font-medium text-sm text-white shadow-violet-500/20 shadow-xs transition-all duration-200 hover:scale-[1.03] hover:from-violet-500 hover:to-indigo-400 hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100">
                        {aiLoading && (
                          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/20 to-transparent" />
                        )}
                        <span className="relative flex items-center gap-1.5">
                          <LunaMoon
                            variant="phase"
                            thinking={aiLoading}
                            size={22}
                            className="size-[22px]"
                          />
                          <span>
                            {aiLoading
                              ? "Analyzing..."
                              : `Enrich with ${AI_ASSISTANT_NAME}`}
                          </span>
                        </span>
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Branding & Media Section */}
              <div className="flex flex-col gap-3 border-t pt-4">
                <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Branding & Gallery Media
                </h4>

                {/* Hidden File Uploaders */}
                <input
                  type="file"
                  id="vendor-logo-uploader"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <input
                  type="file"
                  id="vendor-hero-uploader"
                  accept="image/*"
                  onChange={handleHeroUpload}
                  className="hidden"
                  disabled={uploadingHero}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                  {/* BRAND LOGO CARD (Aspect ratio 1:1, takes 4 columns on desktop) */}
                  <div className="sm:col-span-4 flex flex-col gap-2">
                    <Label className={LABEL_CLASS}>Logo</Label>
                    <div className="group/logo relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-background transition-all hover:border-primary/50">
                      {uploadingLogo ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center text-primary">
                          <Loader2 className="size-6 animate-spin" />
                          <p className="text-[10px]">Uploading...</p>
                        </div>
                      ) : logoUrlValue ? (
                        <>
                          <img
                            src={logoUrlValue}
                            alt="Brand Logo"
                            className="absolute inset-0 size-full object-contain p-3"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover/logo:opacity-100 flex items-center justify-center gap-2">
                            <Label
                              htmlFor="vendor-logo-uploader"
                              className="cursor-pointer rounded bg-white px-2 py-1 text-[10px] font-medium text-black hover:bg-gray-100">
                              Change
                            </Label>
                            <button
                              type="button"
                              onClick={() => setValue("logoUrl", "")}
                              className="rounded bg-destructive px-2 py-1 text-[10px] font-medium text-destructive-foreground hover:bg-destructive/90">
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <Label
                          htmlFor="vendor-logo-uploader"
                          className="flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 p-4 text-center text-muted-foreground/60 transition-colors hover:bg-muted/10 hover:text-muted-foreground">
                          <Upload className="size-6 text-muted-foreground/40" />
                          <p className="text-[11px] font-medium">Upload Logo</p>
                          <p className="text-muted-foreground/50 text-[9px]">
                            Max 5MB
                          </p>
                        </Label>
                      )}
                    </div>
                    {/* Manual trigger for candidate selection */}
                    {pickerData.logoCandidates.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPickerOpen(true)}
                        className="mt-1 w-full text-[10px] h-7 gap-1">
                        <Image className="size-3" /> Select Logo Candidate
                      </Button>
                    )}
                  </div>

                  {/* HERO BANNER CARD (Aspect ratio 16:9, takes 8 columns on desktop) */}
                  <div className="sm:col-span-8 flex flex-col gap-2">
                    <Label className={LABEL_CLASS}>Hero Banner</Label>
                    <div className="group/hero relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-background transition-all hover:border-primary/50">
                      {uploadingHero ? (
                        <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center text-primary">
                          <Loader2 className="size-6 animate-spin" />
                          <p className="text-[10px]">Uploading...</p>
                        </div>
                      ) : heroImageUrlValue ? (
                        <>
                          <img
                            src={heroImageUrlValue}
                            alt="Hero Showcase"
                            className="absolute inset-0 size-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover/hero:opacity-100 flex items-center justify-center gap-2">
                            <Label
                              htmlFor="vendor-hero-uploader"
                              className="cursor-pointer rounded bg-white px-2 py-1 text-[10px] font-medium text-black hover:bg-gray-100">
                              Change
                            </Label>
                            <button
                              type="button"
                              onClick={() => setValue("heroImageUrl", "")}
                              className="rounded bg-destructive px-2 py-1 text-[10px] font-medium text-destructive-foreground hover:bg-destructive/90">
                              Remove
                            </button>
                          </div>
                        </>
                      ) : (
                        <Label
                          htmlFor="vendor-hero-uploader"
                          className="flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 p-4 text-center text-muted-foreground/60 transition-colors hover:bg-muted/10 hover:text-muted-foreground">
                          <Upload className="size-6 text-muted-foreground/40" />
                          <p className="text-[11px] font-medium">
                            Upload Hero Banner
                          </p>
                          <p className="text-muted-foreground/50 text-[9px]">
                            Max 5MB
                          </p>
                        </Label>
                      )}
                    </div>
                    {/* Manual trigger for candidate selection */}
                    {pickerData.imageCandidates.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPickerOpen(true)}
                        className="mt-1 w-full text-[10px] h-7 gap-1">
                        <Image className="size-3" /> Select Hero Candidate
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Number */}
              <Controller
                control={control}
                name="accountNumber"
                render={({ field, fieldState }) => (
                  <Field
                    className="flex flex-col gap-1.5"
                    data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Account Number</Label>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="one-time-code"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field
                    className="flex flex-col gap-1.5"
                    data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Company Description</Label>
                    <Textarea
                      {...field}
                      placeholder="Brief company description..."
                      aria-invalid={fieldState.invalid}
                      className="min-h-[64px]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Address */}
              <Controller
                control={control}
                name="street"
                render={({ field, fieldState }) => (
                  <Field
                    className="flex flex-col gap-1.5"
                    data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Street Address</Label>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      autoComplete="one-time-code"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="grid grid-cols-4 gap-4">
                <Controller
                  control={control}
                  name="city"
                  render={({ field, fieldState }) => (
                    <Field
                      className="col-span-2 flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>City</Label>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        autoComplete="one-time-code"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="state"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>State</Label>
                      <Input
                        {...field}
                        maxLength={2}
                        aria-invalid={fieldState.invalid}
                        autoComplete="one-time-code"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="zip"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>ZIP</Label>
                      <Input
                        {...field}
                        inputMode="numeric"
                        maxLength={5}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) =>
                          field.onChange(formatZip(e.target.value))
                        }
                        autoComplete="one-time-code"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Rep Info */}
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="repName"
                  render={({ field, fieldState }) => (
                    <Field
                      className="col-span-2 flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Contact Name</Label>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        autoComplete="one-time-code"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="repEmail"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Contact Email</Label>
                      <Input
                        {...field}
                        type="email"
                        aria-invalid={fieldState.invalid}
                        autoComplete="one-time-code"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="repPhone"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Contact Phone</Label>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) =>
                          field.onChange(formatPhone(e.target.value))
                        }
                        autoComplete="one-time-code"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Social Media Links */}
              <div className="mt-2 border-muted/60 border-t pt-4">
                <h4 className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Social Media Links
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="instagram"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                        data-invalid={fieldState.invalid}>
                        <Label className={LABEL_CLASS}>Instagram URL</Label>
                        <Input
                          {...field}
                          placeholder="https://instagram.com/handle"
                          aria-invalid={fieldState.invalid}
                          onBlur={(e) => {
                            field.onBlur();
                            field.onChange(cleanTrailingSlash(e.target.value));
                          }}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="pinterest"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                        data-invalid={fieldState.invalid}>
                        <Label className={LABEL_CLASS}>Pinterest URL</Label>
                        <Input
                          {...field}
                          placeholder="https://pinterest.com/handle"
                          aria-invalid={fieldState.invalid}
                          onBlur={(e) => {
                            field.onBlur();
                            field.onChange(cleanTrailingSlash(e.target.value));
                          }}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="facebook"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                        data-invalid={fieldState.invalid}>
                        <Label className={LABEL_CLASS}>Facebook URL</Label>
                        <Input
                          {...field}
                          placeholder="https://facebook.com/handle"
                          aria-invalid={fieldState.invalid}
                          onBlur={(e) => {
                            field.onBlur();
                            field.onChange(cleanTrailingSlash(e.target.value));
                          }}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="youtube"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                        data-invalid={fieldState.invalid}>
                        <Label className={LABEL_CLASS}>YouTube URL</Label>
                        <Input
                          {...field}
                          placeholder="https://youtube.com/c/handle"
                          aria-invalid={fieldState.invalid}
                          onBlur={(e) => {
                            field.onBlur();
                            field.onChange(cleanTrailingSlash(e.target.value));
                          }}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="xTwitter"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5"
                        data-invalid={fieldState.invalid}>
                        <Label className={LABEL_CLASS}>X / Twitter URL</Label>
                        <Input
                          {...field}
                          placeholder="https://x.com/handle"
                          aria-invalid={fieldState.invalid}
                          onBlur={(e) => {
                            field.onBlur();
                            field.onChange(cleanTrailingSlash(e.target.value));
                          }}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>

              {/* Notes */}
              <Controller
                control={control}
                name="notes"
                render={({ field, fieldState }) => (
                  <Field
                    className="flex flex-col gap-1.5"
                    data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Internal Notes</Label>
                    <Textarea
                      {...field}
                      placeholder="Discount codes, account notes, etc..."
                      aria-invalid={fieldState.invalid}
                      className="min-h-[72px]"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || aiLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || aiLoading}
                className="flex items-center gap-2">
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {mode === "edit" ? "Save Changes" : "Create Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        logoCandidates={pickerData.logoCandidates}
        imageCandidates={pickerData.imageCandidates}
        onApply={(logo, hero) => {
          if (logo) setValue("logoUrl", logo);
          if (hero) setValue("heroImageUrl", hero);
        }}
      />
    </>
  );
}
