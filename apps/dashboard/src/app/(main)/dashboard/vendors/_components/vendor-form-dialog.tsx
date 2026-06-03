"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AI_ASSISTANT_NAME } from "@/lib/ai-assistant";
import { runAiActionWithRetry } from "@/lib/ai-retry";
import type { Vendor } from "@/lib/types";
import { formatPhone, formatZip, isValidUsPhone, isValidUsZip } from "@/lib/utils";
import { autofillVendorFromUrl } from "@/server/ai-actions";

export const VENDOR_CATEGORIES = [
  "Appliances",
  "Furniture",
  "Fabric & Textiles",
  "Lighting",
  "Stone & Tile",
  "Hardware & Plumbing",
  "Art & Accessories",
  "Flooring",
  "Window Treatments",
  "Custom Millwork",
  "Outdoor & Landscape",
  "Other",
];

export const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required."),
  category: z.string(),
  description: z.string(),
  website: z.string(),
  accountNumber: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string().refine(isValidUsZip, "Enter a valid 5-digit ZIP code."),
  logoUrl: z.string(),
  heroImageUrl: z.string(),
  repName: z.string(),
  repEmail: z.union([z.string().email("Please enter a valid email address."), z.literal("")]),
  repPhone: z.string().refine(isValidUsPhone, "Enter a valid 10-digit US phone number."),
  notes: z.string(),
  instagram: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
  pinterest: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
  facebook: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
  youtube: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
  xTwitter: z.union([z.string().url("Enter a valid URL."), z.literal("")]),
});

export type VendorFormData = z.infer<typeof vendorSchema>;

export const EMPTY_VENDOR_FORM: VendorFormData = {
  name: "",
  category: "",
  description: "",
  website: "",
  accountNumber: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  logoUrl: "",
  heroImageUrl: "",
  repName: "",
  repEmail: "",
  repPhone: "",
  notes: "",
  instagram: "",
  pinterest: "",
  facebook: "",
  youtube: "",
  xTwitter: "",
};

export function vendorToForm(vendor: Vendor): VendorFormData {
  return {
    name: vendor.name,
    category: vendor.category ?? "",
    description: vendor.description ?? "",
    website: vendor.website ?? "",
    accountNumber: vendor.accountNumber ?? "",
    street: vendor.street ?? "",
    city: vendor.city ?? "",
    state: vendor.state ?? "",
    zip: formatZip(vendor.zip ?? ""),
    logoUrl: vendor.logoUrl ?? "",
    heroImageUrl: vendor.heroImageUrl ?? "",
    repName: vendor.repName ?? "",
    repEmail: vendor.repEmail ?? "",
    repPhone: formatPhone(vendor.repPhone ?? ""),
    notes: vendor.notes ?? "",
    instagram: vendor.instagram ?? "",
    pinterest: vendor.pinterest ?? "",
    facebook: vendor.facebook ?? "",
    youtube: vendor.youtube ?? "",
    xTwitter: vendor.xTwitter ?? "",
  };
}

const LABEL_CLASS = "h-5 flex items-center";

// ─── Image Picker ─────────────────────────────────────────────────────────────

interface ImagePickerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  logoCandidates: string[];
  imageCandidates: string[];
  onApply: (logo: string | null, hero: string | null) => void;
}

function ImagePickerDialog({ open, onOpenChange, logoCandidates, imageCandidates, onApply }: ImagePickerDialogProps) {
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
          <DialogTitle className="text-lg">Choose Images</DialogTitle>
          <DialogDescription>
            {AI_ASSISTANT_NAME} found multiple candidates. Select the best logo and main image for this vendor.
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
                    onClick={() => setSelectedLogo(url === selectedLogo ? null : url)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-muted/30 transition-all ${
                      selectedLogo === url
                        ? "border-primary shadow-md"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-contain p-2"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
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
                    onClick={() => setSelectedHero(url === selectedHero ? null : url)}
                    className={`relative aspect-video overflow-hidden rounded-lg border-2 bg-muted/30 transition-all ${
                      selectedHero === url
                        ? "border-primary shadow-md"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
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
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(selectedLogo, selectedHero);
              onOpenChange(false);
            }}
          >
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

export function VendorFormDialog({ open, onOpenChange, mode, initialData, onSave }: VendorFormDialogProps) {
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

  useEffect(() => {
    if (open) reset(initialData ?? EMPTY_VENDOR_FORM);
  }, [open, initialData, reset]);

  const handleEnrich = async () => {
    const url = getValues("website");
    if (!url) return;
    setAiLoading(true);
    const toastId = toast.loading(`${AI_ASSISTANT_NAME} is analyzing the vendor site…`);
    try {
      const result = await runAiActionWithRetry(() => autofillVendorFromUrl(url), { toastId });
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

        if (d.showImagePicker && (d.logoCandidates?.length || d.imageCandidates?.length)) {
          setPickerData({
            logoCandidates: d.logoCandidates ?? [],
            imageCandidates: d.imageCandidates ?? [],
          });
          setPickerOpen(true);
        }

        toast.success(`Vendor enriched with ${AI_ASSISTANT_NAME} — please review the fields.`, {
          id: toastId,
        });
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
        }}
      >
        <DialogContent className="bg-popover/95 backdrop-blur-md sm:max-w-3xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <DialogHeader>
              <DialogTitle className="text-xl">{mode === "edit" ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
              <DialogDescription>
                Input sourcing details, vendor contacts, and designer procurement notes.
              </DialogDescription>
            </DialogHeader>

            <div className="-mr-4 flex max-h-[65vh] flex-col gap-4 overflow-y-auto py-2 pr-4 pl-0.5">
              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field className="col-span-2 flex flex-col gap-1.5 sm:col-span-1" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>
                        Name <span className="ml-0.5 text-destructive">*</span>
                      </Label>
                      <Input {...field} placeholder="e.g. Arteriors, RH" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <Field className="col-span-2 flex flex-col gap-1.5 sm:col-span-1" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Category</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              {/* Website + Enrich button */}
              <Controller
                control={control}
                name="website"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Website</Label>
                    <div className="flex gap-2">
                      <Input
                        {...field}
                        placeholder="www.arteriorshome.com"
                        aria-invalid={fieldState.invalid}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleEnrich}
                        disabled={!field.value || aiLoading || isSubmitting}
                        className="group relative h-10 shrink-0 cursor-pointer overflow-hidden border-0 bg-linear-to-r from-violet-600 to-indigo-500 px-3 font-medium text-sm text-white shadow-violet-500/20 shadow-xs transition-all duration-200 hover:scale-[1.03] hover:from-violet-500 hover:to-indigo-400 hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100"
                      >
                        {aiLoading && (
                          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/20 to-transparent" />
                        )}
                        <span className="relative flex items-center gap-1.5">
                          <LunaMoon variant="phase" thinking={aiLoading} size={22} className="size-[22px]" />
                          <span>{aiLoading ? "Analyzing..." : `Enrich with ${AI_ASSISTANT_NAME}`}</span>
                        </span>
                      </Button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* AI Image Previews */}
              {(logoUrlValue || heroImageUrlValue) && (
                <div className="flex items-center gap-3 rounded-lg border border-muted/60 bg-muted/30 px-3 py-2.5">
                  <LunaMoon variant="phase" size={14} />
                  <span className="font-medium text-muted-foreground text-xs">AI images:</span>
                  <div className="flex flex-1 gap-2">
                    {logoUrlValue && (
                      <div className="relative">
                        <div className="flex size-9 items-center justify-center overflow-hidden rounded border bg-background">
                          <img
                            src={logoUrlValue}
                            alt="Logo"
                            className="h-full w-full object-contain p-1"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("logoUrl", "")}
                          className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                          aria-label="Remove logo"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    )}
                    {heroImageUrlValue && (
                      <div className="relative">
                        <div className="h-9 w-14 overflow-hidden rounded border bg-background">
                          <img
                            src={heroImageUrlValue}
                            alt="Hero"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("heroImageUrl", "")}
                          className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                          aria-label="Remove hero image"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Number */}
              <Controller
                control={control}
                name="accountNumber"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Account Number</Label>
                    <Input {...field} placeholder="e.g. TRA-002341" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Description */}
              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Company Description</Label>
                    <Textarea
                      {...field}
                      placeholder="Brief company description..."
                      aria-invalid={fieldState.invalid}
                      className="min-h-[64px]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {/* Address */}
              <Controller
                control={control}
                name="street"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Street Address</Label>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <div className="grid grid-cols-4 gap-4">
                <Controller
                  control={control}
                  name="city"
                  render={({ field, fieldState }) => (
                    <Field className="col-span-2 flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>City</Label>
                      <Input {...field} aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="state"
                  render={({ field, fieldState }) => (
                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>State</Label>
                      <Input {...field} maxLength={2} aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="zip"
                  render={({ field, fieldState }) => (
                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>ZIP</Label>
                      <Input
                        {...field}
                        inputMode="numeric"
                        maxLength={5}
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => field.onChange(formatZip(e.target.value))}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    <Field className="col-span-2 flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Representative Name</Label>
                      <Input {...field} placeholder="e.g. Diana Prince" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="repEmail"
                  render={({ field, fieldState }) => (
                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Rep Email</Label>
                      <Input {...field} type="email" aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="repPhone"
                  render={({ field, fieldState }) => (
                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>Rep Phone</Label>
                      <Input
                        {...field}
                        placeholder="(555) 000-0000"
                        aria-invalid={fieldState.invalid}
                        onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                        data-invalid={fieldState.invalid}
                      >
                        <Label className={LABEL_CLASS}>Instagram URL</Label>
                        <Input
                          {...field}
                          placeholder="https://instagram.com/handle"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="pinterest"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                        data-invalid={fieldState.invalid}
                      >
                        <Label className={LABEL_CLASS}>Pinterest URL</Label>
                        <Input
                          {...field}
                          placeholder="https://pinterest.com/handle"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="facebook"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                        data-invalid={fieldState.invalid}
                      >
                        <Label className={LABEL_CLASS}>Facebook URL</Label>
                        <Input {...field} placeholder="https://facebook.com/handle" aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="youtube"
                    render={({ field, fieldState }) => (
                      <Field
                        className="col-span-2 flex flex-col gap-1.5 sm:col-span-1"
                        data-invalid={fieldState.invalid}
                      >
                        <Label className={LABEL_CLASS}>YouTube URL</Label>
                        <Input
                          {...field}
                          placeholder="https://youtube.com/c/handle"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="xTwitter"
                    render={({ field, fieldState }) => (
                      <Field className="col-span-2 flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                        <Label className={LABEL_CLASS}>X / Twitter URL</Label>
                        <Input {...field} placeholder="https://x.com/handle" aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Internal Notes</Label>
                    <Textarea
                      {...field}
                      placeholder="Discount codes, account notes, etc..."
                      aria-invalid={fieldState.invalid}
                      className="min-h-[72px]"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || aiLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || aiLoading} className="flex items-center gap-2">
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
