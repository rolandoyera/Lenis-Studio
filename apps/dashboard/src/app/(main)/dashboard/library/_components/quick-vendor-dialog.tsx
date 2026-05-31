"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { addVendor } from "@/lib/db";
import type { Vendor } from "@/lib/types";

interface QuickVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly created vendor so the host can add + select it. */
  onCreated: (vendor: Vendor) => void;
}

/** Lightweight inline vendor creation, used from the item form's vendor selector. */
export function QuickVendorDialog({ open, onOpenChange, onCreated }: QuickVendorDialogProps) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);

  // Clear fields each time the dialog is opened.
  useEffect(() => {
    if (open) {
      setName("");
      setWebsite("");
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vendor name is required.");
      return;
    }
    setSaving(true);
    try {
      const created = await addVendor({
        name: name.trim(),
        website: website.trim(),
        repName: "",
        repEmail: "",
        repPhone: "",
        notes: "Quick-created during Catalog Item entry.",
      });
      onCreated(created);
      onOpenChange(false);
      toast.success(`Vendor "${created.name}" created and selected!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create vendor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs bg-popover/98 backdrop-blur-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-base">Quick Create Vendor</DialogTitle>
            <DialogDescription className="text-xs">
              Register a trade supplier vendor instantly to connect with this catalog item.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Restoration Hardware"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground">Website</Label>
              <Input
                placeholder="e.g. site.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="flex items-center gap-1.5">
              {saving && <Loader2 className="size-3 animate-spin" />}
              Create Vendor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
