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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/lib/types";

import { EMPTY_PROJECT_FORM, PROJECT_STATUSES, type ProjectFormData, projectSchema } from "./project-constants";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  submitting: boolean;
  /** Pre-fill values when editing, or seed defaults (e.g. a pre-selected client) when adding. */
  initialData?: ProjectFormData;
  /** Clients for the parent-client selector. Omit when the client is locked. */
  clients?: Client[];
  /** When set, the project is bound to this client and the selector is hidden. */
  lockedClientId?: string;
  /** Client display name, shown in the description when the client is locked. */
  clientName?: string;
  onSubmit: (data: ProjectFormData) => void | Promise<void>;
}

const LABEL_CLASS = "h-5 flex items-center";

/**
 * Shared Add / Edit dialog for a design project. Used both from the Projects page
 * (with a parent-client selector) and from a client detail page (client locked).
 */
export function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  submitting,
  initialData,
  clients,
  lockedClientId,
  clientName,
  onSubmit,
}: ProjectFormDialogProps) {
  const seed = (): ProjectFormData => ({
    ...EMPTY_PROJECT_FORM,
    ...initialData,
    clientId: lockedClientId ?? initialData?.clientId ?? "",
  });

  const { control, handleSubmit, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: seed(),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reseed only when the dialog opens
  useEffect(() => {
    if (open) reset(seed());
  }, [open, reset]);

  const title = mode === "edit" ? "Edit Project Specifications" : "Initialize Design Project";
  const submitLabel = mode === "edit" ? "Save Specifications" : "Initialize Project";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md lg:max-w-2xl bg-popover/95 backdrop-blur-md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>
              {lockedClientId && clientName ? (
                <>
                  Set up a new remodeling space, budget pool, and address pre-assigned to{" "}
                  <span className="font-medium text-foreground">{clientName}</span>.
                </>
              ) : (
                "Assign the project to a client, define budgets, and specify design addresses."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Parent client — hidden when locked to a specific client */}
            {!lockedClientId && (
              <Controller
                control={control}
                name="clientId"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>
                      Parent Client <span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(clients ?? []).map((client) => (
                          <SelectItem key={client.uid} value={client.uid}>
                            {client.firstName} {client.lastName}
                            {client.company ? ` (${client.company})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label className={LABEL_CLASS}>
                    Project Title <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    {...field}
                    placeholder="e.g. Penthouse Living Room, Coastal Kitchen"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={control}
                name="budget"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Project Budget Pool</Label>
                    <Input {...field} placeholder="e.g. $150,000" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="status"
                render={({ field, fieldState }) => (
                  <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                    <Label className={LABEL_CLASS}>Status</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={control}
              name="address"
              render={({ field, fieldState }) => (
                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label className={LABEL_CLASS}>Site / Shipping Address</Label>
                  <Input {...field} placeholder="e.g. 100 Ocean Drive, Newport, RI" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field className="flex flex-col gap-1.5" data-invalid={fieldState.invalid}>
                  <Label className={LABEL_CLASS}>Project Brief & Goals</Label>
                  <Textarea
                    {...field}
                    placeholder="Warm organic minimalism, marble accent walls, gold hardware finish accents..."
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
