"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addOrganization } from "@/lib/db";
import type { Organization } from "@/lib/types";

// Schema for tenant creation form
const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, "Please enter an organization name (min 2 characters).")
    .max(100),
  organizationId: z
    .string()
    .min(3, "Organization ID must be at least 3 characters.")
    .max(30)
    .regex(
      /^[a-z0-9-]+$/,
      "ID can only contain lowercase letters, numbers, and hyphens (no spaces).",
    ),
  adminName: z
    .string()
    .min(2, "Please enter the admin's full name.")
    .max(100)
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2,
      "Please enter both first and last name.",
    ),
  adminEmail: z.string().email("Please enter a valid email address."),
  plan: z.enum(["Starter", "Pro", "Enterprise"]),
});

type CreateTenantFormData = z.infer<typeof createTenantSchema>;

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgs: Organization[];
  onTenantCreated: (newOrg: Organization) => void;
}

export function CreateTenantDialog({
  open,
  onOpenChange,
  orgs,
  onTenantCreated,
}: CreateTenantDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  // Form setup
  const { control, handleSubmit, reset, setValue } =
    useForm<CreateTenantFormData>({
      resolver: zodResolver(createTenantSchema),
      defaultValues: {
        name: "",
        organizationId: "",
        adminName: "",
        adminEmail: "",
        plan: "Pro",
      },
    });

  // Reset form fields on dialog close
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  // Auto-generate org ID slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameVal = e.target.value;
    const slug = nameVal
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 30);
    setValue("organizationId", slug, { shouldValidate: true });
  };

  // Handle tenant creation submit
  const handleCreateSubmit = async (data: CreateTenantFormData) => {
    if (submitting) return;

    // Check if organization ID is already taken
    const slug = data.organizationId.trim().toLowerCase();
    const exists = orgs.some((o) => o.organizationId === slug);
    if (exists) {
      toast.error(`Organization ID '${slug}' is already taken.`);
      return;
    }

    setSubmitting(true);
    try {
      const newOrg = await addOrganization(
        {
          organizationId: slug,
          name: data.name.trim(),
          adminEmail: data.adminEmail.trim().toLowerCase(),
          plan: data.plan,
          status: "Active",
        },
        data.adminName.trim(),
      );

      onTenantCreated(newOrg);
      toast.success("SaaS tenant successfully provisioned!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error("Failed to create tenant organization. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="size-5 text-primary" />
            Provision Design Studio Tenant
          </DialogTitle>
          <DialogDescription>
            Assign the new organization name, identifier slug, and the primary
            administrator email address.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleCreateSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          {/* Organization Name */}
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-name">Organization Name</FieldLabel>
                <Input
                  {...field}
                  id="org-name"
                  placeholder="e.g. Sarvian Design Group"
                  disabled={submitting}
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange(e);
                  }}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Organization ID Slug */}
          <Controller
            control={control}
            name="organizationId"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-slug">
                  Organization ID / URL Slug
                </FieldLabel>
                <Input
                  {...field}
                  id="org-slug"
                  placeholder="e.g. org-sarvian"
                  disabled={submitting}
                  aria-invalid={fieldState.invalid}
                  onChange={(e) => {
                    const val = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "");
                    field.onChange(val);
                  }}
                />
                <p className="text-[10px] text-muted-foreground/80 leading-normal">
                  This identifier must be globally unique. Only lowercase
                  letters, numbers, and hyphens are allowed.
                </p>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DropdownMenuSeparator className="my-1" />
          <h4 className="font-semibold text-primary/80 text-xs uppercase tracking-wider">
            Primary Administrator
          </h4>

          {/* Admin Full Name */}
          <Controller
            control={control}
            name="adminName"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-admin-name">
                  Administrator Full Name
                </FieldLabel>
                <Input
                  {...field}
                  id="org-admin-name"
                  placeholder="e.g. Rolando Yera"
                  disabled={submitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Admin Email */}
          <Controller
            control={control}
            name="adminEmail"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-admin-email">
                  Administrator Email Address
                </FieldLabel>
                <Input
                  {...field}
                  id="org-admin-email"
                  placeholder="e.g. admin@studio.com"
                  disabled={submitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Service Plan */}
          <Controller
            control={control}
            name="plan"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="org-plan">Service Plan Tier</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={submitting}
                >
                  <SelectTrigger
                    id="org-plan"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Select a plan tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starter">Starter Plan</SelectItem>
                    <SelectItem value="Pro">Pro Plan</SelectItem>
                    <SelectItem value="Enterprise">Enterprise Plan</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DialogFooter className="mt-4 gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Provisioning...
                </>
              ) : (
                "Provision Tenant"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
