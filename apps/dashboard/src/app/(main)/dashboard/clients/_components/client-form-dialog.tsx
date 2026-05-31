"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  type ClientFormData,
  EMPTY_CLIENT_FORM,
  formatPhoneNumber,
} from "./client-constants";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  submitting: boolean;
  /** Pre-fill field values when editing an existing client. */
  defaultValues?: Partial<ClientFormData>;
  /** Called with the current field values when the form is submitted. */
  onSubmit: (data: ClientFormData) => void;
}

const LABEL_CLASS =
  "text-xs font-semibold tracking-wider uppercase text-muted-foreground";

/**
 * Shared Add / Edit dialog for a client profile. Manages its own field state,
 * seeded from `defaultValues` each time the dialog opens.
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
  const [form, setForm] = useState<ClientFormData>({
    ...EMPTY_CLIENT_FORM,
    ...defaultValues,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: reseed only when the dialog opens, not on every defaultValues change
  useEffect(() => {
    if (open) setForm({ ...EMPTY_CLIENT_FORM, ...defaultValues });
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>Phone Number</Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: formatPhoneNumber(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>Company Name</Label>
                <Input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>Street Address</Label>
              <Input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label className={LABEL_CLASS}>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>ZIP Code</Label>
                <Input
                  value={form.zip}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>General Notes</Label>
              <Textarea
                placeholder="This is where you can add any notes about the client..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
