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
import { deleteVendor, getVendor, getVendorLibraryItems, updateVendor } from "@/lib/db";
import type { LibraryItem, Vendor } from "@/lib/types";
import { formatPhone, normalizePhone } from "@/lib/utils";
import { mirrorVendorImagesToFirebase } from "@/lib/vendor-image-mirror";

import { VendorDetailHeader } from "../_components/vendor-detail-header";
import { VendorDetailHero } from "../_components/vendor-detail-hero";
import { VendorDetailItems } from "../_components/vendor-detail-items";
import { type VendorFormData, VendorFormDialog, vendorToForm } from "../_components/vendor-form-dialog";

interface PageProps {
  params: Promise<{ vendorId: string }>;
}

export default function VendorDetailPage({ params }: PageProps) {
  const { vendorId } = use(params);
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    const orgId = profile.organizationId;
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
  }, [vendorId, router, profile, authLoading]);

  const handleEdit = async (data: VendorFormData) => {
    if (!vendor) return;
    const mirrored = await mirrorVendorImagesToFirebase({
      logoUrl: data.logoUrl,
      heroImageUrl: data.heroImageUrl,
    });
    const updatedData = {
      ...data,
      logoUrl: mirrored.logoUrl,
      heroImageUrl: mirrored.heroImageUrl,
    };
    await updateVendor(vendor.vendorId, updatedData);
    setVendor({ ...vendor, ...updatedData });
    toast.success("Vendor updated successfully!");
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    if (!vendor) return;
    setDeleting(true);
    try {
      await deleteVendor(vendor.vendorId);
      toast.success("Vendor deleted.");
      router.push("/dashboard/vendors");
    } catch {
      toast.error("Failed to delete vendor.");
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <VendorDetailHeader
        vendor={vendor}
        onEdit={() => setIsEditOpen(true)}
        onRequestDelete={() => setIsDeleteOpen(true)}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Hero header card */}
        <VendorDetailHero vendor={vendor} />

        {/* Linked Library Items Card */}
        <VendorDetailItems items={items} />
      </div>

      {/* Detail cards grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Account & Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Building2 className="size-5 text-primary" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {vendor.accountNumber ? (
              <div className="flex flex-col gap-1">
                <Label>Account Number</Label>
                <span className="flex items-center gap-2 font-mono text-foreground/80">
                  <Hash className="size-3.5 text-muted-foreground" />
                  {vendor.accountNumber}
                </span>
              </div>
            ) : null}

            {vendor.street || vendor.city || vendor.state || vendor.zip ? (
              <div className="flex flex-col gap-1">
                <Label>Address</Label>
                <span className="flex items-start gap-2 text-foreground/80">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {vendor.street && <span className="block">{vendor.street}</span>}
                    {(vendor.city || vendor.state || vendor.zip) && (
                      <span className="block">
                        {[vendor.city, vendor.state].filter(Boolean).join(", ") + (vendor.zip ? ` ${vendor.zip}` : "")}
                      </span>
                    )}
                  </span>
                </span>
              </div>
            ) : null}
            {!vendor.description &&
              !vendor.accountNumber &&
              !vendor.street &&
              !vendor.city &&
              !vendor.state &&
              !vendor.zip && <p className="text-muted-foreground/50 text-sm italic">No account information on file.</p>}
          </CardContent>
        </Card>

        {/* Rep Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <Mail className="size-5 text-primary" />
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
                  <Mail className="size-3.5 text-muted-foreground" />
                  {vendor.repEmail}
                </a>
              </div>
            ) : null}
            {vendor.repPhone ? (
              <div className="flex flex-col gap-1">
                <Label>Phone</Label>
                <a
                  href={`tel:${normalizePhone(vendor.repPhone)}`}
                  className="flex items-center gap-2 text-foreground/80 transition-colors hover:text-primary"
                >
                  <Phone className="size-3.5 text-muted-foreground" />
                  {formatPhone(vendor.repPhone)}
                </a>
              </div>
            ) : null}
            {!vendor.repName && !vendor.repEmail && !vendor.repPhone && (
              <p className="text-muted-foreground/50 text-sm italic">No contact on file.</p>
            )}
          </CardContent>
        </Card>

        {/* Sourcing Notes — full width */}

        <Card className="md:col-span-2 min-h-40">
          <CardHeader className="pb-3">
            <CardTitle>
              <FileText className="size-5 text-primary" />
              Sourcing Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground/80 text-sm leading-relaxed">{vendor.notes}</p>
          </CardContent>
        </Card>
      </div>

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
