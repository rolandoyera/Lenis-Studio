"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

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
import { Textarea } from "@/components/ui/textarea";
import { formatPhone } from "@/lib/utils";

import { type ClientFormData, clientSchema, EMPTY_CLIENT_FORM } from "./client-constants";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  submitting: boolean;
  /** Pre-fill field values when editing an existing client. */
  defaultValues?: Partial<ClientFormData>;
  /** Called with the validated field values when the form is submitted. */
  onSubmit: (data: ClientFormData) => void;
}

const LABEL_CLASS = "h-5 flex items-center";

/**
 * Shared Add / Edit dialog for a client profile. Wired through React Hook Form +
 * Zod, reseeded from `defaultValues` each time the dialog opens.
 */
export function ClientFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  submitting,
  defaultValues,
  onSubmit,
}: ClientFormDialogProps) {
  const { control, handleSubmit, reset } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { ...EMPTY_CLIENT_FORM, ...defaultValues, phone: formatPhone(defaultValues?.phone ?? "") },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reseed only when the dialog opens, not on every defaultValues change
  useEffect(() => {
    if (open) reset({ ...EMPTY_CLIENT_FORM, ...defaultValues, phone: formatPhone(defaultValues?.phone ?? "") });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="firstName"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>
                      First Name <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="lastName"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>
                      Last Name <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label className={LABEL_CLASS}>Email Address</Label>
                  <Input {...field} type="email" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Phone Number</Label>
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
              <Controller
                control={control}
                name="company"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Company Name</Label>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

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

            <div className="grid grid-cols-4 gap-3">
              <Controller
                control={control}
                name="city"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5 col-span-2" data-invalid={fieldState.invalid}>
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
                    <Label className={LABEL_CLASS}>ZIP Code</Label>
                    <Input {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label className={LABEL_CLASS}>General Notes</Label>
                  <Textarea
                    {...field}
                    placeholder="This is where you can add any notes about the client..."
                    aria-invalid={fieldState.invalid}
                    className="min-h-[80px]"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
