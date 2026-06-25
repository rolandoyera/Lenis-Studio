"use client";

import { type ReactNode, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Loader2, MoreVertical } from "lucide-react";
import {
  type Control,
  type UseFormSetValue,
  type UseFormWatch,
  useForm,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Organization } from "@/lib/types";

import {
  type CompanyProfileFormData,
  EMPTY_COMPANY_PROFILE_FORM,
  companyProfileSchema,
  organizationToForm,
} from "./company-constants";

/** Fixed-height label wrapper that keeps fields from shifting when errors toggle. */
export const LABEL_CLASS = "h-5 flex items-center";

/** Form helpers handed to each section's field group, rendered inside the dialog. */
export interface SectionDialogChildProps {
  control: Control<CompanyProfileFormData>;
  watch: UseFormWatch<CompanyProfileFormData>;
  setValue: UseFormSetValue<CompanyProfileFormData>;
  container: HTMLElement | null;
}

export interface PatchResult {
  patch: Partial<Organization>;
  prevPaths?: Array<string | undefined>;
  nextPaths?: Array<string | undefined>;
}

/** Card header with a ⋮ → Edit dropdown, shared by every display card. */
export function EditableCardHeader({
  title,
  onEdit,
}: {
  title: string;
  onEdit: () => void;
}) {
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
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
    </CardHeader>
  );
}

/**
 * Shared modal shell for editing one section of the company profile. Owns the
 * react-hook-form instance, resets from the org on open, and delegates persistence
 * to the caller via `buildPatch` + `persist`.
 */
export function SectionEditDialog({
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
