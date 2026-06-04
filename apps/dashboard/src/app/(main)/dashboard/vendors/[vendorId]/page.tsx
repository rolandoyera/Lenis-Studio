"use client";

import { use, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Building2,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Tag,
  Trash2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { deleteVendor, getVendor, updateVendor } from "@/lib/db";
import type { Vendor } from "@/lib/types";
import { formatPhone, getInitials, normalizePhone } from "@/lib/utils";
import { mirrorVendorImagesToFirebase } from "@/lib/vendor-image-mirror";

import HeaderBackLink from "../../_components/HeaderBackLink";
import { type VendorFormData, VendorFormDialog, vendorToForm } from "../_components/vendor-form-dialog";

interface PageProps {
  params: Promise<{ vendorId: string }>;
}

const CARD_GRADIENTS = [
  "from-violet-500/20 via-violet-500/8 to-transparent",
  "from-sky-500/20 via-sky-500/8 to-transparent",
  "from-emerald-500/20 via-emerald-500/8 to-transparent",
  "from-amber-500/20 via-amber-500/8 to-transparent",
  "from-rose-500/20 via-rose-500/8 to-transparent",
  "from-indigo-500/20 via-indigo-500/8 to-transparent",
  "from-teal-500/20 via-teal-500/8 to-transparent",
];

function vendorGradient(name: string) {
  return CARD_GRADIENTS[name.charCodeAt(0) % CARD_GRADIENTS.length];
}

export default function VendorDetailPage({ params }: PageProps) {
  const { vendorId } = use(params);
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading || !profile) return;
    const orgId = profile.organizationId;
    async function load() {
      try {
        const data = await getVendor(vendorId);
        if (!data || data.organizationId !== orgId) {
          toast.error("Vendor not found.");
          router.push("/dashboard/vendors");
          return;
        }
        setVendor(data);
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

  const initials = getInitials(vendor.name);
  const gradient = vendorGradient(vendor.name);

  const websiteHref = vendor.website
    ? vendor.website.startsWith("http")
      ? vendor.website
      : `https://${vendor.website}`
    : null;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <HeaderBackLink />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge className="border border-primary/20 bg-primary/10 text-primary uppercase">{vendor.category}</Badge>
        </div>
        <h1 className="mt-1 font-heading font-medium text-3xl tracking-tight">{vendor.name}</h1>
      </div>

      {/* Hero header card */}
      <Card className="overflow-hidden pt-0">
        {/* Banner: hero image → gradient fallback */}
        <div className="relative flex h-62 w-full items-end overflow-hidden">
          {vendor.heroImageUrl ? (
            <img src={vendor.heroImageUrl} alt="Vendor Image" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-0 left-6 z-10 translate-y-1/2">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-background shadow-md">
              {vendor.logoUrl ? (
                <img
                  src={vendor.logoUrl}
                  alt={vendor.name}
                  className="h-full w-full object-contain p-2"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="select-none font-bold font-heading text-2xl text-foreground/80">
                  {initials.slice(0, 2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Name row */}
        <CardContent className="flex flex-col gap-4 pt-14 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-bold font-heading text-2xl tracking-tight">{vendor.name}</h1>
              {vendor.category && (
                <Badge variant="secondary" className="text-xs">
                  {vendor.category}
                </Badge>
              )}
            </div>
            {websiteHref ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-primary"
              >
                <Globe className="size-3.5" />
                {vendor.website?.replace(/(^\w+:|^)\/\//, "")}
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <span className="text-muted-foreground/50 text-sm italic">No website on file</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-1.5">
              <Edit3 className="size-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detail cards grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Account & Address */}
        <Card className="bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {vendor.description ? (
              <div className="flex flex-col gap-1">
                <Label>About</Label>
                <p className="text-foreground/80 leading-relaxed">{vendor.description}</p>
              </div>
            ) : null}
            {vendor.accountNumber ? (
              <div className="flex flex-col gap-1">
                <Label>Account Number</Label>
                <span className="flex items-center gap-2 font-mono text-foreground/80">
                  <Hash className="size-3.5 text-muted-foreground" />
                  {vendor.accountNumber}
                </span>
              </div>
            ) : null}
            {vendor.category ? (
              <div className="flex flex-col gap-1">
                <Label>Category</Label>
                <span className="flex items-center gap-2">
                  <Tag className="size-3.5 text-muted-foreground" />
                  {vendor.category}
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
              !vendor.category &&
              !vendor.street &&
              !vendor.city &&
              !vendor.state &&
              !vendor.zip && <p className="text-muted-foreground/50 text-sm italic">No account information on file.</p>}
          </CardContent>
        </Card>

        {/* Rep Contact */}
        <Card className="bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              Representative Contact
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
              <p className="text-muted-foreground/50 text-sm italic">No representative contact on file.</p>
            )}
          </CardContent>
        </Card>

        {/* Sourcing Notes — full width */}
        {vendor.notes && (
          <Card className="bg-card/60 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-semibold text-sm">
                <FileText className="size-4 text-muted-foreground" />
                Sourcing Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-foreground/80 text-sm leading-relaxed">{vendor.notes}</p>
            </CardContent>
          </Card>
        )}
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
        <AlertDialogContent className="bg-popover/95 backdrop-blur-md sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{vendor.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the vendor from the directory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
