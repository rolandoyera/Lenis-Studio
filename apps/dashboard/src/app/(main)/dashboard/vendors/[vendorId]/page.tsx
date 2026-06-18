"use client";

import { use, useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Building2, FileText, Hash, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  addLibraryItem,
  deleteReplacedStorageFiles,
  deleteVendor,
  getVendor,
  getVendorLibraryItems,
  updateVendor,
} from "@/lib/db";
import { mirrorExternalImagesToFirebase } from "@/lib/library-image-mirror";
import type { LibraryItem, Vendor } from "@/lib/types";
import { formatVendorPhone, vendorPhoneTel } from "@/lib/utils";
import { mirrorVendorImagesToFirebase } from "@/lib/vendor-image-mirror";

import { LibraryItemFormDialog } from "../../library/_components/library-item-form-dialog";
import { useLibraryItemForm } from "../../library/_components/use-library-item-form";
import { formatVendorAddress } from "../_components/vendor-constants";
import { type VendorFormData, VendorFormDialog, vendorToForm } from "../_components/vendor-form-dialog";
import { VendorHeader } from "../_components/vendor-header";
import { VendorHero } from "../_components/vendor-hero";
import { VendorItems } from "../_components/vendor-items";

interface PageProps {
  params: Promise<{ vendorId: string }>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function VendorDetailPage({ params }: PageProps) {
  const { vendorId } = use(params);
  const router = useRouter();
  const { organizationId, loading: authLoading } = useAuth();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const itemForm = useLibraryItemForm();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  const handleOpenAddItem = () => {
    if (!vendor) return;
    itemForm.reset({ vendorId: vendor.vendorId });
    setIsAddItemOpen(true);
  };

  const handleAddItem = async () => {
    if (!vendor) return;
    setAddingItem(true);
    try {
      // Mirror any external (AI-sourced) images into Firebase so the item self-hosts them.
      const { imageUrls, coverImageUrl, coverImagePath, images } = await mirrorExternalImagesToFirebase(
        {
          imageUrls: itemForm.formData.imageUrls,
          coverImageUrl: itemForm.formData.coverImageUrl,
          coverImagePath: itemForm.formData.coverImagePath,
          images: itemForm.formData.images,
        },
        itemForm.tempItemId,
      );
      const created = await addLibraryItem(
        {
          ...itemForm.formData,
          imageUrls,
          coverImageUrl,
          coverImagePath,
          images,
          organizationId: vendor.organizationId,
        },
        itemForm.tempItemId,
      );
      setItems((prev) => [created, ...prev]);
      toast.success("Item added to library and linked to this vendor!");
      setIsAddItemOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save library item.");
    } finally {
      setAddingItem(false);
    }
  };

  useEffect(() => {
    if (authLoading || !organizationId) return;
    const orgId = organizationId; // stable string dependency; profile object identity churns on each heartbeat
    async function load() {
      try {
        const [vendorData, itemsData] = await Promise.all([
          getVendor(vendorId),
          getVendorLibraryItems(orgId, vendorId),
        ]);
        if (!vendorData || vendorData.organizationId !== orgId) {
          toast.error("Vendor not found.");
          router.push("/dashboard/vendors");
          return;
        }
        setVendor(vendorData);
        setItems(itemsData);
      } catch {
        toast.error("Failed to load vendor.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [vendorId, router, organizationId, authLoading]);

  const handleEdit = async (data: VendorFormData) => {
    if (!vendor) return;
    try {
      const mirrored = await mirrorVendorImagesToFirebase(
        {
          logoUrl: data.logoUrl,
          logoPath: data.logoPath,
          heroImageUrl: data.heroImageUrl,
          heroImagePath: data.heroImagePath,
        },
        vendor.vendorId,
      );
      const updatedData = {
        ...data,
        logoUrl: mirrored.logoUrl,
        logoPath: mirrored.logoPath,
        heroImageUrl: mirrored.heroImageUrl,
        heroImagePath: mirrored.heroImagePath,
      };

      try {
        await deleteReplacedStorageFiles(
          [vendor.logoPath, vendor.heroImagePath],
          [updatedData.logoPath, updatedData.heroImagePath],
        );
      } catch (error) {
        toast.error(`Failed to clean up replaced brand images: ${getErrorMessage(error, "Unknown error")}`);
        return; // Abort update if storage deletion fails (except object-not-found which is ignored internally)
      }

      await updateVendor(vendor.vendorId, updatedData);
      setVendor({ ...vendor, ...updatedData });
      toast.success("Vendor updated successfully!");
      setIsEditOpen(false);
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to update vendor."));
    }
  };

  const handleDelete = async () => {
    if (!vendor) return;
    setDeleting(true);
    try {
      await deleteVendor(vendor);
      toast.success("Vendor deleted.");
      router.push("/dashboard/vendors");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete vendor."));
      setDeleting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Loading Vendor Profile</p>
      </div>
    );
  }

  if (!vendor) return null;

  // Prefer the stored formattedAddress; otherwise compose it from the discrete
  // fields, falling back to the deprecated US-only fields on older docs.
  const addressText =
    vendor.formattedAddress?.trim() ||
    formatVendorAddress({
      addressLine1: vendor.addressLine1 ?? vendor.street,
      addressLine2: vendor.addressLine2,
      city: vendor.city,
      region: vendor.region ?? vendor.state,
      postalCode: vendor.postalCode ?? vendor.zip,
      country: vendor.country,
    });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <VendorHeader vendor={vendor} onEdit={() => setIsEditOpen(true)} onRequestDelete={() => setIsDeleteOpen(true)} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Hero header card — defines the row height */}
        <VendorHero vendor={vendor} />

        {/* Linked Library Items Card — fills the row height and scrolls internally */}
        <div className="relative">
          <div className="md:absolute md:inset-0">
            <VendorItems items={items} onAddItem={handleOpenAddItem} />
          </div>
        </div>
      </div>

      {/* Account Info Card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Account & Address */}
        <Card className="pt-0">
          <CardHeader className="bg-muted/50">
            <CardTitle className="h-14">
              <Building2 className="icons" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {vendor.accountNumber ? (
              <div className="flex flex-col gap-1">
                <Label>Account Number</Label>
                <span className="flex items-center gap-2 font-mono text-foreground/80">
                  <Hash className="icons" />
                  {vendor.accountNumber}
                </span>
              </div>
            ) : null}

            {addressText ? (
              <div className="flex flex-col gap-1">
                <Label>Address</Label>
                <span className="flex items-start gap-2 text-foreground/80">
                  <MapPin className="icons" />
                  <span>{addressText}</span>
                </span>
              </div>
            ) : null}
            {!vendor.accountNumber && !addressText && (
              <p className="text-muted-foreground/50 text-sm italic">No account information on file.</p>
            )}
          </CardContent>
        </Card>

        {/* Rep Contact */}
        <Card className="pt-0">
          <CardHeader className="bg-muted/50">
            <CardTitle className="h-14">
              <Mail className="icons" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {vendor.repName ? (
              <div className="flex flex-col gap-1">
                <Label>Name</Label>
                <span className="font-medium">{vendor.repName}</span>
              </div>
            ) : null}
            {vendor.repEmail ? (
              <div className="flex flex-col gap-1">
                <Label>Email</Label>
                <a
                  href={`mailto:${vendor.repEmail}`}
                  className="flex items-center gap-2 text-foreground/80 transition-colors hover:text-primary"
                >
                  <Mail className="icons" />
                  {vendor.repEmail}
                </a>
              </div>
            ) : null}
            {vendor.repPhone ? (
              <div className="flex flex-col gap-1">
                <Label>Phone</Label>
                <a
                  href={`tel:${vendorPhoneTel(vendor.repPhone, vendor.repPhoneCountry)}`}
                  className="flex items-center gap-2 text-foreground/80 transition-colors hover:text-primary"
                >
                  <Phone className="icons" />
                  {formatVendorPhone(vendor.repPhone, vendor.repPhoneCountry)}
                </a>
              </div>
            ) : null}
            {!vendor.repName && !vendor.repEmail && !vendor.repPhone && (
              <p className="text-muted-foreground/50 text-sm italic">No contact on file.</p>
            )}
          </CardContent>
        </Card>

        {/* Sourcing Notes — full width */}

        <Card className="min-h-40 pt-0 md:col-span-2">
          <CardHeader className="bg-muted/50">
            <CardTitle className="h-14">
              <FileText className="icons" />
              Sourcing Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground/80 text-sm leading-relaxed">{vendor.notes}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Library Item dialog — vendor locked to this page's vendor */}
      <LibraryItemFormDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        title="Add Item Specifications"
        submitLabel="Add Catalog Item"
        submitting={addingItem}
        onSubmit={handleAddItem}
        form={itemForm}
        vendors={[vendor]}
        // Vendor is locked to this page, so Quick Add is never shown/called.
        onQuickAddVendor={() => undefined}
        uploaderId="vendor-item-image-uploader"
        lockVendor
      />

      {/* Edit dialog */}
      {vendor && (
        <VendorFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          mode="edit"
          initialData={vendorToForm(vendor)}
          onSave={handleEdit}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-popover sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {items.length > 0 ? `Cannot delete "${vendor.name}"` : `Delete "${vendor.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {items.length > 0 ? (
                  <>
                    <span className="block font-semibold text-destructive">
                      This vendor is currently linked to {items.length} active catalog{" "}
                      {items.length === 1 ? "item" : "items"}.
                    </span>
                    <span>
                      You must delete these items or reassign their vendor references first before this vendor can be
                      removed from the directory.
                    </span>
                    <div className="mt-3 max-h-40 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/40 bg-muted/30">
                      {items.map((item) => (
                        <div key={item.itemId} className="flex items-center justify-between p-2.5 text-xs">
                          <span className="max-w-[240px] truncate font-medium">{item.name}</span>
                          <Link
                            href={`/dashboard/library/${item.itemId}`}
                            onClick={() => setIsDeleteOpen(false)}
                            className="font-semibold text-primary hover:underline"
                          >
                            View Item
                          </Link>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <span>This will permanently remove the vendor from the directory. This action cannot be undone.</span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {items.length > 0 ? (
              <AlertDialogCancel>Close</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  Delete Vendor
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
