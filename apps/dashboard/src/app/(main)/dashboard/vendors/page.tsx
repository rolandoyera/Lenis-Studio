"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  Building2,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { H1 } from "@/components/ui/typography";
import { addVendor, getVendors } from "@/lib/db";
import type { Vendor } from "@/lib/types";
import { formatPhone, getInitials } from "@/lib/utils";

import {
  EMPTY_VENDOR_FORM,
  type VendorFormData,
  VendorFormDialog,
} from "./_components/vendor-form-dialog";
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  PinterestIcon,
  YoutubeIcon,
} from "@/components/icons/icons";

// Cycle through accent gradients by first character for visual variety
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
  const idx = name.charCodeAt(0) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[idx];
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleOpenAdd = () => setIsAddOpen(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("search")) setSearchQuery(params.get("search")!);
      if (params.get("add") === "true") {
        handleOpenAdd();
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    async function loadData() {
      try {
        const data = await getVendors();
        setVendors(data);
      } catch {
        toast.error("Failed to fetch vendors from database.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const handleAdd = async (data: VendorFormData) => {
    try {
      const created = await addVendor(data);
      setVendors((prev) => [created, ...prev]);
      toast.success("New vendor added successfully!");
      setIsAddOpen(false);
    } catch {
      toast.error("Failed to save vendor details.");
      throw new Error("save failed");
    }
  };

  const filteredVendors = vendors
    .filter((v) => {
      const term = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(term) ||
        v.repName?.toLowerCase().includes(term) ||
        v.category?.toLowerCase().includes(term) ||
        v.notes?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <H1>Vendor Directory</H1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage trade vendors and client procurement representatives.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="sm:self-start bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2">
          <Plus className="size-4" />
          Add Vendor
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          placeholder="Search vendors, representatives or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Loading Sourcing Directory
          </p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] border-dashed text-center p-8 bg-background/30">
          <Building2 className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg">No vendors found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            {searchQuery
              ? "Try broadening your search or clear the filter."
              : "Get started by adding your first vendor contact."}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleOpenAdd}
              className="mt-4 flex items-center gap-2">
              <Plus className="size-4" />
              Add Vendor
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 3xl:grid-cols-6 gap-5">
          {filteredVendors.map((vendor) => (
            <VendorCard key={vendor.vendorId} vendor={vendor} />
          ))}
        </div>
      )}

      <VendorFormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        mode="add"
        initialData={EMPTY_VENDOR_FORM}
        onSave={handleAdd}
      />
    </div>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const initials = getInitials(vendor.name);
  const gradient = vendorGradient(vendor.name);

  return (
    <Link
      href={`/dashboard/vendors/${vendor.vendorId}`}
      className="group block">
      <Card className="relative overflow-hidden flex flex-col h-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer pt-0">
        {/* Hero area: real image → gradient fallback */}
        <div className="relative flex items-center justify-center h-56 w-full overflow-hidden">
          {vendor.heroImageUrl ? (
            <img
              src={vendor.heroImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
          )}
          {/* Subtle scrim so monogram stays legible over photos */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Logo or initials monogram */}
          <div className="relative flex size-12 items-center justify-center overflow-hidden">
            {vendor.logoUrl ? (
              <img
                src={vendor.logoUrl}
                alt={vendor.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-2xl font-bold font-heading text-foreground/80 select-none">
                {initials.slice(0, 2)}
              </span>
            )}
          </div>

          {vendor.category && (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 text-[10px] font-semibold tracking-wide bg-black/20 backdrop-blur-sm border-0 text-white">
              {vendor.category}
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-col gap-3 pt-4 flex-1">
          {/* Name + website */}
          <div>
            <h3 className="font-heading font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {vendor.name}
            </h3>
            {vendor.website ? (
              <span className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <Globe className="size-3 shrink-0" />
                <span className="truncate">
                  {vendor.website.replace(/(^\w+:|^)\/\//, "")}
                </span>
                <ExternalLink className="size-2.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/50 italic mt-0.5 block">
                No website
              </span>
            )}
          </div>

          {/* Rep contact */}
          {vendor.repName || vendor.repEmail || vendor.repPhone ? (
            <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 border border-muted/60 px-3 py-2.5">
              {vendor.repName && (
                <p className="text-xs font-medium text-foreground/80 truncate">
                  {vendor.repName}
                </p>
              )}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {vendor.repEmail && (
                  <span className="flex items-center gap-1.5 truncate">
                    <Mail className="size-3 shrink-0" />
                    <span className="truncate">{vendor.repEmail}</span>
                  </span>
                )}
                {vendor.repPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3 shrink-0" />
                    {formatPhone(vendor.repPhone)}
                  </span>
                )}
              </div>
            </div>
          ) : null}

          {/* Address or account number teaser */}
          {(vendor.street ||
            vendor.city ||
            vendor.state ||
            vendor.accountNumber) && (
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto">
              {(vendor.street || vendor.city || vendor.state) && (
                <span className="flex items-start gap-1.5">
                  <MapPin className="size-3 shrink-0 mt-0.5" />
                  <span className="line-clamp-1">
                    {[vendor.street, vendor.city, vendor.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </span>
              )}
              {vendor.accountNumber && (
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">
                    Acct:
                  </span>
                  <span className="font-mono text-foreground/70">
                    {vendor.accountNumber}
                  </span>
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-card border-t-0 flex items-center gap-3">
          <GlobeIcon size={24} color="#000000" />
          <InstagramIcon size={24} color="#000000" />
          <PinterestIcon size={24} color="#000000" />
          <FacebookIcon size={24} color="#000000" />
          <YoutubeIcon size={24} color="#000000" />
        </CardFooter>
      </Card>
    </Link>
  );
}
