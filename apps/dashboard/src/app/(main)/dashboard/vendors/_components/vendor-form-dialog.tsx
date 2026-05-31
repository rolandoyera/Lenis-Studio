"use client";

import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Vendor } from "@/lib/types";

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

export type VendorFormData = {
  name: string;
  category: string;
  website: string;
  accountNumber: string;
  address: string;
  repName: string;
  repEmail: string;
  repPhone: string;
  notes: string;
};

export const EMPTY_VENDOR_FORM: VendorFormData = {
  name: "",
  category: "",
  website: "",
  accountNumber: "",
  address: "",
  repName: "",
  repEmail: "",
  repPhone: "",
  notes: "",
};

export function vendorToForm(vendor: Vendor): VendorFormData {
  return {
    name: vendor.name,
    category: vendor.category ?? "",
    website: vendor.website ?? "",
    accountNumber: vendor.accountNumber ?? "",
    address: vendor.address ?? "",
    repName: vendor.repName ?? "",
    repEmail: vendor.repEmail ?? "",
    repPhone: vendor.repPhone ?? "",
    notes: vendor.notes ?? "",
  };
}

function formatPhoneNumber(value: string) {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  return `+${cleaned.slice(0, cleaned.length - 10)} (${cleaned.slice(cleaned.length - 10, cleaned.length - 7)}) ${cleaned.slice(cleaned.length - 7, cleaned.length - 4)}-${cleaned.slice(cleaned.length - 4)}`;
}

const LABEL = "text-xs font-semibold tracking-wider uppercase text-muted-foreground";

interface VendorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: VendorFormData;
  onSave: (data: VendorFormData) => Promise<void>;
}

export function VendorFormDialog({ open, onOpenChange, mode, initialData, onSave }: VendorFormDialogProps) {
  const [formData, setFormData] = useState<VendorFormData>(initialData ?? EMPTY_VENDOR_FORM);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof VendorFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  const handleOpenChange = (open: boolean) => {
    if (!submitting) {
      if (open && initialData) setFormData(initialData);
      onOpenChange(open);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setSubmitting(false);
    }
  };

  // Sync form when initialData changes (e.g. dialog re-opens for a different vendor)
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && initialData) setFormData(initialData);
    handleOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg bg-popover/95 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl">{mode === "edit" ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            <DialogDescription>
              Input sourcing details, vendor contacts, and designer procurement notes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
            {/* Name + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className={LABEL}>
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Arteriors, RH"
                  value={formData.name}
                  onChange={set("name")}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className={LABEL}>Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger>
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
              </div>
            </div>

            {/* Website + Account Number */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className={LABEL}>Website</label>
                <Input
                  placeholder="www.arteriorshome.com"
                  value={formData.website}
                  onChange={set("website")}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className={LABEL}>Account Number</label>
                <Input
                  placeholder="e.g. TRA-002341"
                  value={formData.accountNumber}
                  onChange={set("accountNumber")}
                />
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Address</label>
              <Input
                placeholder="123 Design District, Suite 400, Dallas TX 75207"
                value={formData.address}
                onChange={set("address")}
              />
            </div>

            {/* Rep Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={LABEL}>Representative Name</label>
                <Input
                  placeholder="e.g. Diana Prince"
                  value={formData.repName}
                  onChange={set("repName")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL}>Rep Email</label>
                <Input
                  type="email"
                  placeholder="rep@example.com"
                  value={formData.repEmail}
                  onChange={set("repEmail")}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL}>Rep Phone</label>
                <Input
                  placeholder="(555) 000-0000"
                  value={formData.repPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, repPhone: formatPhoneNumber(e.target.value) }))
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Sourcing Notes</label>
              <Textarea
                placeholder="Discount codes, suite number, account notes..."
                value={formData.notes}
                onChange={set("notes")}
                className="min-h-[72px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "edit" ? "Save Changes" : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
