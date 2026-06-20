"use client";

import { type ReactNode, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDownIcon,
  Edit,
  Loader2,
  MoreVertical,
  Percent,
  Upload,
} from "lucide-react";
import {
  type Control,
  Controller,
  type UseFormSetValue,
  type UseFormWatch,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipDropdownMenu,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteReplacedStorageFiles,
  getOrganization,
  updateOrganization,
  uploadOrgBrandingImage,
} from "@/lib/db";
import type { Organization } from "@/lib/types";
import { cn, formatUsZip, formatVendorPhone } from "@/lib/utils";

import {
  COUNTRIES,
  countryName,
  regionLabelFor,
} from "../../vendors/_components/vendor-constants";
import {
  type CompanyProfileFormData,
  CURRENCY_OPTIONS,
  EMPTY_COMPANY_PROFILE_FORM,
  companyProfileSchema,
  formToOrganizationUpdate,
  organizationToForm,
  TIMEZONE_OPTIONS,
} from "./company-constants";

const LABEL_CLASS = "h-5 flex items-center";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const COMBO_TRIGGER_CLASS = cn(
  "flex h-10 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  "dark:bg-input/30",
);

interface ComboItem {
  code: string;
  name: string;
}

const TIMEZONE_ITEMS: ComboItem[] = TIMEZONE_OPTIONS.map((tz) => ({
  code: tz,
  name: tz,
}));

const currencyLabel = (code: string | undefined) =>
  CURRENCY_OPTIONS.find((c) => c.code === code)?.label ?? code ?? "";

/** Keep only digits and a single decimal point (e.g. a pasted "15%" → "15"). */
function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("")}` : whole;
}

/** Keep only digits (whole numbers, e.g. expiration days). */
const sanitizeInteger = (value: string): string => value.replace(/\D/g, "");

// ─── Searchable select (country / timezone) ───────────────────────────────────

function SearchSelect({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  container,
}: {
  items: ComboItem[];
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  container: HTMLElement | null;
}) {
  const selected = items.find((i) => i.code === value) ?? null;
  return (
    <Combobox
      value={selected}
      onValueChange={(item: ComboItem | null) => onChange(item?.code ?? "")}
      items={items}
      filter={(item: ComboItem, inputValue: string) =>
        item.name.toLowerCase().includes(inputValue.toLowerCase())
      }>
      <ComboboxTrigger
        render={
          <button
            type="button"
            className={cn(
              COMBO_TRIGGER_CLASS,
              !selected && "text-muted-foreground",
            )}>
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <ComboboxContent container={container}>
        <ComboboxInput showTrigger={false} placeholder={searchPlaceholder} />
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: ComboItem) => (
            <ComboboxItem key={item.code} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ─── Branding image upload field ──────────────────────────────────────────────

function BrandingImageUpload({
  id,
  label,
  hint,
  type,
  organizationId,
  url,
  dark,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  type: "logo" | "logo-light" | "logo-dark" | "favicon";
  organizationId: string;
  url: string;
  /** Dark backdrop, for previewing light/transparent logos. */
  dark?: boolean;
  onChange: (url: string, path: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image size exceeds 5MB limit.", { duration: 8000 });
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const result = await uploadOrgBrandingImage(file, type, organizationId);
      onChange(result.url, result.path);
      toast.success(`${label} uploaded successfully!`);
    } catch (error) {
      console.error(`${label} upload error:`, error);
      toast.error(`Failed to upload ${label.toLowerCase()}.`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className={LABEL_CLASS}>{label}</Label>
      <input
        type="file"
        id={id}
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />
      <div
        className={cn(
          "group/img relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border transition-all hover:border-primary/50",
          dark ? "bg-neutral-900" : "bg-background",
        )}>
        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center text-primary">
            <Loader2 className="size-6 animate-spin" />
            <p className="text-[10px]">Uploading...</p>
          </div>
        ) : url ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: form preview uses dynamic branding URLs. */}
            <img
              src={url}
              alt={label}
              className="absolute inset-0 size-full object-contain p-3"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
              <Label
                htmlFor={id}
                className="cursor-pointer rounded bg-white px-2 py-1 font-medium text-[10px] text-black hover:bg-gray-100">
                Change
              </Label>
              <button
                type="button"
                onClick={() => onChange("", "")}
                className="rounded bg-destructive px-2 py-1 font-medium text-[10px] text-destructive-foreground hover:bg-destructive/90">
                Remove
              </button>
            </div>
          </>
        ) : (
          <Label
            htmlFor={id}
            className="flex size-full cursor-pointer flex-col items-center justify-center gap-1.5 p-4 text-center text-muted-foreground/60 transition-colors hover:bg-muted/10 hover:text-muted-foreground">
            <Upload className="size-6 text-muted-foreground/40" />
            <p className="font-medium text-[11px]">Upload {label}</p>
            <p className="text-[9px] text-muted-foreground/50">
              {hint ?? "Max 5MB"}
            </p>
          </Label>
        )}
      </div>
    </div>
  );
}

// ─── Color picker field ───────────────────────────────────────────────────────

function ColorField({
  label,
  value,
  invalid,
  onChange,
}: {
  label: string;
  value: string;
  invalid?: boolean;
  onChange: (hex: string) => void;
}) {
  return (
    <Field className="flex flex-col gap-1.5" data-invalid={invalid}>
      <Label className={LABEL_CLASS}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-1"
        />
        <Input
          value={value}
          placeholder="#000000"
          maxLength={7}
          aria-invalid={invalid}
          onChange={(e) => {
            let v = e.target.value.toUpperCase();
            if (v && !v.startsWith("#")) v = `#${v}`;
            onChange(v.replace(/[^#0-9A-F]/g, ""));
          }}
        />
      </div>
    </Field>
  );
}

// ─── Read-only display primitives ─────────────────────────────────────────────

function DisplayField({
  label,
  value,
  href,
  className,
}: {
  label: string;
  value?: string;
  href?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-muted-foreground text-xs">{label}</span>
      {value ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-primary text-sm hover:underline">
            {value}
          </a>
        ) : (
          <span className="truncate text-sm">{value}</span>
        )
      ) : (
        <span className="text-muted-foreground/50 text-sm">—</span>
      )}
    </div>
  );
}

function BrandingThumb({
  label,
  url,
  dark,
}: {
  label: string;
  url?: string;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div
        className={cn(
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border",
          dark ? "bg-neutral-900" : "bg-background",
        )}>
        {url ? (
          // biome-ignore lint/performance/noImgElement: display uses dynamic branding URLs.
          <img
            src={url}
            alt={label}
            className="absolute inset-0 size-full object-contain p-3"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground/40">Not set</span>
        )}
      </div>
    </div>
  );
}

function ColorSwatch({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      {value ? (
        <span className="flex items-center gap-2 text-sm">
          <span
            className="size-5 rounded border border-border"
            style={{ backgroundColor: value }}
          />
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground/50 text-sm">—</span>
      )}
    </div>
  );
}

// ─── Editable card header (dropdown → Edit) ───────────────────────────────────

function EditableCardHeader({
  title,
  description,
  onEdit,
}: {
  title: string;
  description: string;
  onEdit: () => void;
}) {
  return (
    <CardHeader className="bg-muted/50 py-3">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <CardAction>
        <TooltipDropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="size-4" />
              <span className="sr-only">Actions Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="size-4" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </TooltipDropdownMenu>
      </CardAction>
    </CardHeader>
  );
}

// ─── Section edit dialog (shared shell) ───────────────────────────────────────

interface SectionDialogChildProps {
  control: Control<CompanyProfileFormData>;
  watch: UseFormWatch<CompanyProfileFormData>;
  setValue: UseFormSetValue<CompanyProfileFormData>;
  container: HTMLElement | null;
}

interface PatchResult {
  patch: Partial<Organization>;
  prevPaths?: Array<string | undefined>;
  nextPaths?: Array<string | undefined>;
}

function SectionEditDialog({
  open,
  onOpenChange,
  title,
  description,
  org,
  buildPatch,
  persist,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  org: Organization | null;
  buildPatch: (data: CompanyProfileFormData) => PatchResult;
  persist: (
    patch: Partial<Organization>,
    prevPaths?: Array<string | undefined>,
    nextPaths?: Array<string | undefined>,
  ) => Promise<boolean>;
  children: (props: SectionDialogChildProps) => ReactNode;
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const form = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: EMPTY_COMPANY_PROFILE_FORM,
  });
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = form;

  useEffect(() => {
    if (open && org) reset(organizationToForm(org));
  }, [open, org, reset]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    const { patch, prevPaths, nextPaths } = buildPatch(data);
    const ok = await persist(patch, prevPaths, nextPaths);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) onOpenChange(v);
      }}>
      <DialogContent className="sm:max-w-2xl">
        <div ref={setContainer} />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
          autoComplete="off">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="-mr-4 flex max-h-[65vh] flex-col gap-4 overflow-y-auto py-2 pr-4 pl-0.5">
            {children({ control, watch, setValue, container })}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Per-section field groups (rendered inside the dialog) ─────────────────────

function CompanyInfoFields({
  control,
  watch,
  setValue,
  container,
}: SectionDialogChildProps) {
  const countryValue = watch("country");
  const phoneCountryValue = watch("phoneCountry");
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>
                Company Name <span className="ml-0.5 text-destructive">*</span>
              </Label>
              <Input
                {...field}
                placeholder="e.g. Sarvian Design Group"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="legalName"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>Legal Name</Label>
              <Input
                {...field}
                placeholder="e.g. Sarvian Design Group, LLC"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5 sm:col-span-2"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>Email</Label>
              <Input
                {...field}
                type="email"
                placeholder="hello@studio.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="phoneCountry"
          render={({ field }) => (
            <Field className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>Phone Country</Label>
              <SearchSelect
                items={COUNTRIES}
                value={field.value}
                onChange={(code) => {
                  field.onChange(code);
                  // Re-apply formatting to the existing number under the new country.
                  setValue("phone", formatVendorPhone(watch("phone"), code));
                }}
                placeholder="Select country..."
                searchPlaceholder="Search countries..."
                emptyText="No country found."
                container={container}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>Phone</Label>
              <Input
                {...field}
                placeholder="(555) 123-4567"
                aria-invalid={fieldState.invalid}
                onChange={(e) =>
                  field.onChange(
                    formatVendorPhone(e.target.value, phoneCountryValue),
                  )
                }
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="website"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5 sm:col-span-2"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>Website</Label>
              <Input
                {...field}
                placeholder="https://www.studio.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
        <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider sm:col-span-2">
          Address
        </p>
        <Controller
          control={control}
          name="line1"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5 sm:col-span-2"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>Address Line 1</Label>
              <Input {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="line2"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5 sm:col-span-2"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>Address Line 2</Label>
              <Input
                {...field}
                placeholder="Suite, unit, floor, etc."
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="country"
          render={({ field }) => (
            <Field className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>Country</Label>
              <SearchSelect
                items={COUNTRIES}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select country..."
                searchPlaceholder="Search countries..."
                emptyText="No country found."
                container={container}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5"
              data-invalid={fieldState.invalid}>
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
            <Field
              className="flex flex-col gap-1.5"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>
                {regionLabelFor(countryValue)}
              </Label>
              <Input {...field} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="postalCode"
          render={({ field, fieldState }) => {
            const isUs = countryValue === "US";
            return (
              <Field
                className="flex flex-col gap-1.5"
                data-invalid={fieldState.invalid}>
                <Label className={LABEL_CLASS}>
                  {isUs ? "ZIP Code" : "Postal Code"}
                </Label>
                <Input
                  {...field}
                  inputMode={isUs ? "numeric" : undefined}
                  maxLength={isUs ? 10 : 20}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) =>
                    field.onChange(
                      isUs ? formatUsZip(e.target.value) : e.target.value,
                    )
                  }
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            );
          }}
        />
      </div>
    </>
  );
}

function SocialFields({ control }: SectionDialogChildProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {(
        [
          ["instagram", "Instagram", "https://instagram.com/handle"],
          ["facebook", "Facebook", "https://facebook.com/handle"],
          ["linkedin", "LinkedIn", "https://linkedin.com/company/handle"],
          ["houzz", "Houzz", "https://houzz.com/pro/handle"],
        ] as const
      ).map(([name, label, placeholder]) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <Field
              className="flex flex-col gap-1.5"
              data-invalid={fieldState.invalid}>
              <Label className={LABEL_CLASS}>{label}</Label>
              <Input
                {...field}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      ))}
    </div>
  );
}

function BrandingFields({
  control,
  watch,
  setValue,
  organizationId,
}: SectionDialogChildProps & { organizationId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BrandingImageUpload
          id="org-logo-uploader"
          label="Company Logo"
          type="logo"
          organizationId={organizationId}
          url={watch("logoUrl")}
          onChange={(url, path) => {
            setValue("logoUrl", url, { shouldDirty: true });
            setValue("logoPath", path, { shouldDirty: true });
          }}
        />
        <BrandingImageUpload
          id="org-logo-light-uploader"
          label="Light Logo"
          hint="For dark backgrounds"
          type="logo-light"
          organizationId={organizationId}
          url={watch("logoLightUrl")}
          dark
          onChange={(url, path) => {
            setValue("logoLightUrl", url, { shouldDirty: true });
            setValue("logoLightPath", path, { shouldDirty: true });
          }}
        />
        <BrandingImageUpload
          id="org-logo-dark-uploader"
          label="Dark Logo"
          hint="For light backgrounds"
          type="logo-dark"
          organizationId={organizationId}
          url={watch("logoDarkUrl")}
          onChange={(url, path) => {
            setValue("logoDarkUrl", url, { shouldDirty: true });
            setValue("logoDarkPath", path, { shouldDirty: true });
          }}
        />
        <BrandingImageUpload
          id="org-favicon-uploader"
          label="Favicon"
          hint="Square, ≥ 64px"
          type="favicon"
          organizationId={organizationId}
          url={watch("faviconUrl")}
          onChange={(url, path) => {
            setValue("faviconUrl", url, { shouldDirty: true });
            setValue("faviconPath", path, { shouldDirty: true });
          }}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="primaryColor"
          render={({ field, fieldState }) => (
            <ColorField
              label="Primary Brand Color"
              value={field.value}
              invalid={fieldState.invalid}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="accentColor"
          render={({ field, fieldState }) => (
            <ColorField
              label="Accent Color"
              value={field.value}
              invalid={fieldState.invalid}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </div>
  );
}

function SettingsFields({ control, container }: SectionDialogChildProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Controller
        control={control}
        name="timezone"
        render={({ field }) => (
          <Field className="flex flex-col gap-1.5">
            <Label className={LABEL_CLASS}>Timezone</Label>
            <SearchSelect
              items={TIMEZONE_ITEMS}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select timezone..."
              searchPlaceholder="Search timezones..."
              emptyText="No timezone found."
              container={container}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <Field className="flex flex-col gap-1.5">
            <Label className={LABEL_CLASS}>Currency</Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency..." />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="measurementUnit"
        render={({ field }) => (
          <Field className="flex flex-col gap-1.5">
            <Label className={LABEL_CLASS}>Measurement Unit</Label>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select unit..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imperial">Imperial (in, ft)</SelectItem>
                <SelectItem value="metric">Metric (cm, m)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="defaultMarkupPercent"
        render={({ field, fieldState }) => (
          <Field
            className="flex flex-col gap-1.5"
            data-invalid={fieldState.invalid}>
            <Label className={LABEL_CLASS}>Default Markup</Label>
            <InputGroup>
              <InputGroupInput
                {...field}
                inputMode="decimal"
                placeholder="e.g. 15"
                aria-invalid={fieldState.invalid}
                onChange={(e) =>
                  field.onChange(sanitizeDecimal(e.target.value))
                }
              />
              <InputGroupAddon align="inline-start">
                <Percent />
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="defaultTaxRate"
        render={({ field, fieldState }) => (
          <Field
            className="flex flex-col gap-1.5"
            data-invalid={fieldState.invalid}>
            <Label className={LABEL_CLASS}>Default Tax Rate</Label>
            <InputGroup>
              <InputGroupInput
                {...field}
                inputMode="decimal"
                placeholder="e.g. 8.25"
                aria-invalid={fieldState.invalid}
                onChange={(e) =>
                  field.onChange(sanitizeDecimal(e.target.value))
                }
              />
              <InputGroupAddon align="inline-start">
                <Percent />
              </InputGroupAddon>
            </InputGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="proposalExpirationDays"
        render={({ field, fieldState }) => (
          <Field
            className="flex flex-col gap-1.5"
            data-invalid={fieldState.invalid}>
            <Label className={LABEL_CLASS}>Proposal Expiration (days)</Label>
            <Input
              {...field}
              inputMode="numeric"
              placeholder="e.g. 30"
              aria-invalid={fieldState.invalid}
              onChange={(e) => field.onChange(sanitizeInteger(e.target.value))}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}

// ─── Read-only display cards ──────────────────────────────────────────────────

function CompanyInfoCard({
  org,
  onEdit,
}: {
  org: Organization;
  onEdit: () => void;
}) {
  const cp = org.companyProfile;
  const addr = cp?.address;
  return (
    <Card className="pt-0 lg:col-span-2">
      <EditableCardHeader
        title="Company Information"
        description="Core details used across proposals, invoices, and reports."
        onEdit={onEdit}
      />
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DisplayField
          label="Company Name"
          value={cp?.displayName ?? org.name}
        />
        <DisplayField label="Legal Name" value={cp?.legalName} />
        <DisplayField
          label="Email"
          value={cp?.email}
          href={cp?.email ? `mailto:${cp.email}` : undefined}
        />
        <DisplayField
          label="Phone"
          value={
            cp?.phone ? formatVendorPhone(cp.phone, cp.phoneCountry) : undefined
          }
        />
        <DisplayField
          label="Website"
          value={cp?.website}
          href={cp?.website}
          className="sm:col-span-2"
        />

        <p className="border-t pt-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider sm:col-span-2">
          Address
        </p>
        <DisplayField
          label="Address Line 1"
          value={addr?.line1}
          className="sm:col-span-2"
        />
        <DisplayField
          label="Address Line 2"
          value={addr?.line2}
          className="sm:col-span-2"
        />
        <DisplayField
          label="Country"
          value={addr?.country ? countryName(addr.country) : undefined}
        />
        <DisplayField label="City" value={addr?.city} />
        <DisplayField
          label={regionLabelFor(addr?.country)}
          value={addr?.state}
        />
        <DisplayField
          label={addr?.country === "US" ? "ZIP Code" : "Postal Code"}
          value={addr?.postalCode}
        />
      </CardContent>
    </Card>
  );
}

function SocialCard({
  org,
  onEdit,
}: {
  org: Organization;
  onEdit: () => void;
}) {
  const social = org.companyProfile?.social;
  return (
    <Card className="pt-0">
      <EditableCardHeader
        title="Social Profiles"
        description="Public profile links for client-facing pages."
        onEdit={onEdit}
      />
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DisplayField
          label="Instagram"
          value={social?.instagram}
          href={social?.instagram}
        />
        <DisplayField
          label="Facebook"
          value={social?.facebook}
          href={social?.facebook}
        />
        <DisplayField
          label="LinkedIn"
          value={social?.linkedin}
          href={social?.linkedin}
        />
        <DisplayField
          label="Houzz"
          value={social?.houzz}
          href={social?.houzz}
        />
      </CardContent>
    </Card>
  );
}

function SettingsCard({
  org,
  onEdit,
}: {
  org: Organization;
  onEdit: () => void;
}) {
  const s = org.settings;
  const unitLabel = s?.measurementUnit
    ? s.measurementUnit === "imperial"
      ? "Imperial (in, ft)"
      : "Metric (cm, m)"
    : undefined;
  return (
    <Card className="pt-0">
      <EditableCardHeader
        title="Settings"
        description="Defaults applied to proposals, pricing, and localization."
        onEdit={onEdit}
      />
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DisplayField label="Timezone" value={s?.timezone} />
        <DisplayField
          label="Currency"
          value={s?.currency ? currencyLabel(s.currency) : undefined}
        />
        <DisplayField label="Measurement Unit" value={unitLabel} />
        <DisplayField
          label="Default Markup"
          value={
            typeof s?.defaultMarkupPercent === "number"
              ? `${s.defaultMarkupPercent}%`
              : undefined
          }
        />
        <DisplayField
          label="Default Tax Rate"
          value={
            typeof s?.defaultTaxRate === "number"
              ? `${s.defaultTaxRate}%`
              : undefined
          }
        />
        <DisplayField
          label="Proposal Expiration"
          value={
            typeof s?.proposalExpirationDays === "number"
              ? `${s.proposalExpirationDays} days`
              : undefined
          }
        />
      </CardContent>
    </Card>
  );
}

function BrandingCard({
  org,
  onEdit,
}: {
  org: Organization;
  onEdit: () => void;
}) {
  const cp = org.companyProfile;
  const b = org.branding;
  return (
    <Card className="pt-0 lg:col-span-2">
      <EditableCardHeader
        title="Branding"
        description="Logos and brand colors used throughout the app and exports."
        onEdit={onEdit}
      />
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <BrandingThumb label="Company Logo" url={cp?.logoUrl} />
          <BrandingThumb label="Light Logo" url={b?.logoLightUrl} dark />
          <BrandingThumb label="Dark Logo" url={b?.logoDarkUrl} />
          <BrandingThumb label="Favicon" url={b?.faviconUrl} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ColorSwatch label="Primary Brand Color" value={b?.primaryColor} />
          <ColorSwatch label="Accent Color" value={b?.accentColor} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Company Profile (display cards + per-section edit dialogs) ────────────────

type EditSection = "company" | "social" | "branding" | "settings" | null;

export function CompanyProfileForm() {
  const { organizationId, loading: authLoading } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditSection>(null);

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const id = organizationId;
    async function load() {
      try {
        const data = await getOrganization(id);
        if (data) setOrg(data);
      } catch {
        toast.error("Failed to load company profile.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [organizationId, authLoading]);

  const persist = async (
    patch: Partial<Organization>,
    prevPaths: Array<string | undefined> = [],
    nextPaths: Array<string | undefined> = [],
  ): Promise<boolean> => {
    if (!organizationId || !org) return false;
    const previous = org;
    setOrg({ ...org, ...patch }); // optimistic
    try {
      await updateOrganization(organizationId, patch);
      if (prevPaths.length > 0)
        await deleteReplacedStorageFiles(prevPaths, nextPaths);
      toast.success("Company profile saved.");
      return true;
    } catch (error) {
      console.error("Company profile save error:", error);
      setOrg(previous); // revert
      toast.error("Failed to save company profile.");
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!org) {
    return (
      <p className="text-muted-foreground text-sm">No organization found.</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CompanyInfoCard org={org} onEdit={() => setEditing("company")} />
        <SocialCard org={org} onEdit={() => setEditing("social")} />
        <SettingsCard org={org} onEdit={() => setEditing("settings")} />
        <BrandingCard org={org} onEdit={() => setEditing("branding")} />
      </div>

      {/* Company Information (company + address → companyProfile block) */}
      <SectionEditDialog
        open={editing === "company"}
        onOpenChange={(v) => setEditing(v ? "company" : null)}
        title="Edit Company Information"
        description="Company details and address. A formatted address is generated automatically."
        org={org}
        persist={persist}
        buildPatch={(data) => ({
          patch: {
            companyProfile: formToOrganizationUpdate(data).companyProfile,
          },
        })}>
        {(props) => <CompanyInfoFields {...props} />}
      </SectionEditDialog>

      {/* Social Profiles (nested under companyProfile) */}
      <SectionEditDialog
        open={editing === "social"}
        onOpenChange={(v) => setEditing(v ? "social" : null)}
        title="Edit Social Profiles"
        description="Public profile links for client-facing pages."
        org={org}
        persist={persist}
        buildPatch={(data) => ({
          patch: {
            companyProfile: formToOrganizationUpdate(data).companyProfile,
          },
        })}>
        {(props) => <SocialFields {...props} />}
      </SectionEditDialog>

      {/* Branding (company logo lives on companyProfile; rest on branding) */}
      <SectionEditDialog
        open={editing === "branding"}
        onOpenChange={(v) => setEditing(v ? "branding" : null)}
        title="Edit Branding"
        description="Logos and brand colors used throughout the app and exports."
        org={org}
        persist={persist}
        buildPatch={(data) => {
          const { companyProfile, branding } = formToOrganizationUpdate(data);
          return {
            patch: { companyProfile, branding },
            prevPaths: [
              org.companyProfile?.logoPath,
              org.branding?.logoLightPath,
              org.branding?.logoDarkPath,
              org.branding?.faviconPath,
            ],
            nextPaths: [
              companyProfile.logoPath,
              branding.logoLightPath,
              branding.logoDarkPath,
              branding.faviconPath,
            ],
          };
        }}>
        {(props) => (
          <BrandingFields {...props} organizationId={organizationId ?? ""} />
        )}
      </SectionEditDialog>

      {/* Settings */}
      <SectionEditDialog
        open={editing === "settings"}
        onOpenChange={(v) => setEditing(v ? "settings" : null)}
        title="Edit Settings"
        description="Defaults applied to proposals, pricing, and localization."
        org={org}
        persist={persist}
        buildPatch={(data) => ({
          patch: { settings: formToOrganizationUpdate(data).settings },
        })}>
        {(props) => <SettingsFields {...props} />}
      </SectionEditDialog>
    </>
  );
}
