"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { Building2, Loader2, Mail, MapPin, Phone, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import XTwitterIcon, {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  PinterestIcon,
  YoutubeIcon,
} from "@/components/icons/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { H1 } from "@/components/ui/typography";
import { addVendor, getVendors } from "@/lib/db";
import type { Vendor } from "@/lib/types";
import { formatPhone, getInitials } from "@/lib/utils";

import {
  EMPTY_VENDOR_FORM,
  VENDOR_CATEGORIES,
  type VendorFormData,
  VendorFormDialog,
} from "./_components/vendor-form-dialog";

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
  const [activeCategory, setActiveCategory] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleOpenAdd = () => setIsAddOpen(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search");
      if (searchParam) setSearchQuery(searchParam);
      if (params.get("add") === "true") {
        setIsAddOpen(true);
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
      const matchesSearch =
        v.name.toLowerCase().includes(term) ||
        v.repName?.toLowerCase().includes(term) ||
        v.category?.toLowerCase().includes(term) ||
        v.notes?.toLowerCase().includes(term);

      const matchesCategory = activeCategory === "All" || v.category === activeCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H1>Vendor Directory</H1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage trade vendors and client procurement representatives.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 sm:self-start"
        >
          <Plus className="size-4" />
          Add Vendor
        </Button>
      </div>

      {/* Filter and search controls combined into a clean layout */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b pb-4">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
          <TabsList className="flex flex-wrap h-auto! gap-0.5 max-w-full">
            <TabsTrigger value="All" className="text-[12px] font-semibold px-3 py-1.5 cursor-pointer">
              All Vendors
            </TabsTrigger>
            {VENDOR_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="text-[12px] font-semibold px-3 py-1.5 cursor-pointer">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Quick Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Search vendors, representatives or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background/50 pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Loading Sourcing Directory
          </p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center border-dashed bg-background/30 p-8 text-center">
          <Building2 className="mb-3 size-12 text-muted-foreground/40" />
          <h3 className="font-semibold text-lg">No vendors found</h3>
          <p className="mt-1 max-w-sm text-muted-foreground text-sm">
            {searchQuery
              ? "Try broadening your search or clear the filter."
              : "Get started by adding your first vendor contact."}
          </p>
          {!searchQuery && (
            <Button onClick={handleOpenAdd} className="mt-4 flex items-center gap-2">
              <Plus className="size-4" />
              Add Vendor
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid 3xl:grid-cols-6 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
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

function getDisplayUrl(url: string | null): string {
  if (!url) return "";
  return url
    .replace(/(^\w+:|^)\/\//, "") // Remove protocol
    .replace(/^www\./, "") // Remove www.
    .replace(/\/$/, ""); // Remove trailing slash
}

function formatSocialHref(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const initials = getInitials(vendor.name);
  const gradient = vendorGradient(vendor.name);
  const websiteHref = vendor.website
    ? vendor.website.startsWith("http")
      ? vendor.website
      : `https://${vendor.website}`
    : null;

  const instagramHref = formatSocialHref(vendor.instagram);
  const pinterestHref = formatSocialHref(vendor.pinterest);
  const facebookHref = formatSocialHref(vendor.facebook);
  const youtubeHref = formatSocialHref(vendor.youtube);
  const xTwitterHref = formatSocialHref(vendor.xTwitter);

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden pt-0 shadow-sm transition-all duration-200 has-[.detail-link:hover]:-translate-y-0.5 has-[.detail-link:hover]:border-primary/30 has-[.detail-link:hover]:shadow-md">
      {/* Hero area: real image → gradient fallback */}
      <Link
        href={`/dashboard/vendors/${vendor.vendorId}`}
        className="detail-link relative flex h-56 w-full cursor-pointer items-center justify-center overflow-hidden"
      >
        {vendor.heroImageUrl ? (
          <img src={vendor.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
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
              className="h-full w-full object-contain p-1"
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

        {vendor.category && (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 border-0 bg-black/20 font-semibold text-[10px] text-white tracking-wide backdrop-blur-sm"
          >
            {vendor.category}
          </Badge>
        )}
      </Link>

      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        {/* Name */}
        <div>
          <h3 className="line-clamp-1 font-heading font-semibold text-base leading-tight transition-colors group-has-[.detail-link:hover]:text-primary">
            <Link href={`/dashboard/vendors/${vendor.vendorId}`} className="detail-link cursor-pointer">
              {vendor.name}
            </Link>
          </h3>
        </div>

        {/* Rep contact */}
        {vendor.repName || vendor.repEmail || vendor.repPhone ? (
          <div className="flex flex-col gap-1.5 rounded-lg border border-muted/60 bg-muted/40 px-3 py-2.5">
            {vendor.repName && <p className="truncate font-medium text-foreground/80 text-xs">{vendor.repName}</p>}
            <div className="flex flex-col gap-1 text-muted-foreground text-xs">
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
        {(vendor.street || vendor.city || vendor.state || vendor.zip || vendor.accountNumber) && (
          <div className="mt-auto flex flex-col gap-1 text-muted-foreground text-xs">
            {(vendor.street || vendor.city || vendor.state || vendor.zip) && (
              <span className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3 shrink-0" />
                <span className="line-clamp-1">
                  {[
                    vendor.street,
                    [vendor.city, vendor.state].filter(Boolean).join(", ") + (vendor.zip ? ` ${vendor.zip}` : ""),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
            )}
            {vendor.accountNumber && (
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                  Acct:
                </span>
                <span className="font-mono text-foreground/70">{vendor.accountNumber}</span>
              </span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-3 border-t-0 bg-card text-muted-foreground">
        {websiteHref ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.currentTarget.blur()}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
              >
                <GlobeIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent>{getDisplayUrl(websiteHref)}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="cursor-not-allowed text-muted-foreground/20">
            <GlobeIcon />
          </span>
        )}
        {instagramHref ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={instagramHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.currentTarget.blur()}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
              >
                <InstagramIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent>{getDisplayUrl(instagramHref)}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="cursor-not-allowed text-muted-foreground/20">
            <InstagramIcon />
          </span>
        )}
        {pinterestHref ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={pinterestHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.currentTarget.blur()}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
              >
                <PinterestIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent>{getDisplayUrl(pinterestHref)}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="cursor-not-allowed text-muted-foreground/20">
            <PinterestIcon />
          </span>
        )}
        {facebookHref ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={facebookHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.currentTarget.blur()}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
              >
                <FacebookIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent>{getDisplayUrl(facebookHref)}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="cursor-not-allowed text-muted-foreground/20">
            <FacebookIcon />
          </span>
        )}
        {youtubeHref ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={youtubeHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.currentTarget.blur()}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
              >
                <YoutubeIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent>{getDisplayUrl(youtubeHref)}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="cursor-not-allowed text-muted-foreground/20">
            <YoutubeIcon />
          </span>
        )}
        {xTwitterHref ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={xTwitterHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.currentTarget.blur()}
                className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
              >
                <XTwitterIcon />
              </a>
            </TooltipTrigger>
            <TooltipContent>{getDisplayUrl(xTwitterHref)}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="cursor-not-allowed text-muted-foreground/20">
            <XTwitterIcon />
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
