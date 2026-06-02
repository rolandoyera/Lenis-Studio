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
import { formatPhone, isValidUsPhone } from "@/lib/utils";
import { autofillVendorFromUrl } from "@/server/ai-actions";

export const VENDOR_CATEGORIES = [
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
  logoUrl: z.string(),
  heroImageUrl: z.string(),
  repName: z.string(),
  repEmail: z.union([z.string().email("Please enter a valid email address."), z.literal("")]),
  repPhone: z.string().refine(isValidUsPhone, "Enter a valid 10-digit US phone number."),
  notes: z.string(),
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
  logoUrl: "",
  heroImageUrl: "",
  repName: "",
  repEmail: "",
  repPhone: "",
  notes: "",
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
    logoUrl: vendor.logoUrl ?? "",
    heroImageUrl: vendor.heroImageUrl ?? "",
    repName: vendor.repName ?? "",
    repEmail: vendor.repEmail ?? "",
    repPhone: formatPhone(vendor.repPhone ?? ""),
    notes: vendor.notes ?? "",
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
      <DialogContent className="sm:max-w-2xl bg-popover/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Choose Images</DialogTitle>
          <DialogDescription>
            {AI_ASSISTANT_NAME} found multiple candidates. Select the best logo and main image for this vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-1 max-h-[60vh] overflow-y-auto px-0.5">
          {logoCandidates.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className={LABEL_CLASS}>Logo</p>
              <div className="grid grid-cols-4 gap-2">
                {logoCandidates.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedLogo(url === selectedLogo ? null : url)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-muted/30 transition-all ${
                      selectedLogo === url
                        ? "border-primary shadow-md"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                    {selectedLogo === url && (
                      <div className="absolute top-1 right-1 size-5 rounded-full bg-primary flex items-center justify-center">
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
                    className={`relative aspect-video rounded-lg border-2 overflow-hidden bg-muted/30 transition-all ${
                      selectedHero === url
                        ? "border-primary shadow-md"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                      }}
                    />
                    {selectedHero === url && (
                      <div className="absolute top-1 right-1 size-5 rounded-full bg-primary flex items-center justify-center">
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
        if (d.repPhone) setValue("repPhone", formatPhone(d.repPhone));
        if (d.repEmail) setValue("repEmail", d.repEmail);
        if (d.logoUrl) setValue("logoUrl", d.logoUrl);
        if (d.heroImageUrl) setValue("heroImageUrl", d.heroImageUrl);

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
        <DialogContent className="sm:max-w-3xl bg-popover/95 backdrop-blur-md">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <DialogHeader>
              <DialogTitle className="text-xl">{mode === "edit" ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
              <DialogDescription>
                Input sourcing details, vendor contacts, and designer procurement notes.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2 max-h-[65vh] overflow-y-auto px-0.5">
              {/* Name + Category */}
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field className="flex flex-col gap-1.5 col-span-2 sm:col-span-1" data-invalid={fieldState.invalid}>
                      <Label className={LABEL_CLASS}>
                        Name <span className="text-destructive ml-0.5">*</span>
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
                    <Field className="flex flex-col gap-1.5 col-span-2 sm:col-span-1" data-invalid={fieldState.invalid}>
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
                        className="group relative shrink-0 cursor-pointer overflow-hidden border-0 bg-linear-to-r from-violet-600 to-indigo-500 px-3 font-medium text-white shadow-xs shadow-violet-500/20 transition-all duration-200 hover:scale-[1.03] hover:from-violet-500 hover:to-indigo-400 hover:shadow-lg hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100 h-10 text-sm"
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
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-muted/60">
                  <LunaMoon variant="phase" size={14} />
                  <span className="text-xs text-muted-foreground font-medium">AI images:</span>
                  <div className="flex gap-2 flex-1">
                    {logoUrlValue && (
                      <div className="relative">
                        <div className="size-9 rounded border bg-background flex items-center justify-center overflow-hidden">
                          <img
                            src={logoUrlValue}
                            alt="Logo"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("logoUrl", "")}
                          className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                          aria-label="Remove logo"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    )}
                    {heroImageUrlValue && (
                      <div className="relative">
                        <div className="h-9 w-14 rounded border bg-background overflow-hidden">
                          <img
                            src={heroImageUrlValue}
                            alt="Hero"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue("heroImageUrl", "")}
                          className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
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
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="city"
                  render={({ field, fieldState }) => (
                    <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
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
                      <Input {...field} aria-invalid={fieldState.invalid} />
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
                    <Field className="flex flex-col gap-1.5 col-span-2" data-invalid={fieldState.invalid}>
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
