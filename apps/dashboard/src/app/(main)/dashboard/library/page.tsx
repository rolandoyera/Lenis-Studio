"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  ExternalLink,
  Loader2,
  Plus,
  Search,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H1 } from "@/components/ui/typography";
import { addLibraryItem, getLibraryItems, getVendors } from "@/lib/db";
import { mirrorExternalImagesToFirebase } from "@/lib/library-image-mirror";
import type { LibraryItem, Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { CATEGORIES } from "./_components/library-constants";
import { LibraryItemFormDialog } from "./_components/library-item-form-dialog";
import { QuickVendorDialog } from "./_components/quick-vendor-dialog";
import { useLibraryItemForm } from "./_components/use-library-item-form";
import { PageTitle } from "@/components/page-title-updater";

export default function LibraryPage() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const form = useLibraryItemForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);

  // Fetch Items & Vendors on Mount
  useEffect(() => {
    if (authLoading || !profile) return;
    const orgId = profile.organizationId;

    async function loadData() {
      try {
        const [itemsData, vendorsData] = await Promise.all([
          getLibraryItems(orgId),
          getVendors(orgId),
        ]);
        setItems(itemsData);
        setVendors(vendorsData);

        // Auto-open add modal if deep-linked via Quick Create
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("add") === "true") {
            form.reset();
            setIsModalOpen(true);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
          }
        }
      } catch (error) {
        console.error("Failed to load catalog data:", error);
        toast.error("Failed to fetch library catalog from Firestore.", {
          duration: 8000,
        });
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [profile, authLoading, form.reset]);

  const handleOpenAdd = () => {
    form.reset();
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      // Mirror any external (AI-sourced) images into Firebase so the item self-hosts them.
      const { imageUrls, coverImageUrl } = await mirrorExternalImagesToFirebase(
        form.formData,
      );
      const created = await addLibraryItem({
        ...form.formData,
        imageUrls,
        coverImageUrl,
        organizationId: profile.organizationId,
      });
      setItems((prev) => [created, ...prev]);
      toast.success("New product successfully added to Global Library!");
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save library item.", { duration: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtering
  const filteredItems = items.filter((item) => {
    const parentVendor = vendors.find((v) => v.vendorId === item.vendorId);
    const vendorName = parentVendor?.name || "";
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      vendorName.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query) ||
      item.finishColor?.toLowerCase().includes(query);

    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <PageTitle title="Product Library" />
      {/* Header section with Premium typography & Action trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H1>Product Library</H1>
          <p className="mt-1 text-muted-foreground text-sm">
            Global catalog of furniture, fabric swatches, stone slabs, lighting
            structures, and bespoke services.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 sm:self-start">
          <Plus className="size-4" />
          Add Item to Library
        </Button>
      </div>

      {/* Filter and search controls combined into a clean layout */}
      <div className="flex flex-col items-center justify-between gap-4 border-b pb-4 md:flex-row">
        {/* Category Tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          className="w-full md:w-auto">
          <TabsList className="flex h-auto! max-w-full flex-wrap gap-0.5">
            <TabsTrigger
              value="All"
              className="cursor-pointer px-3 py-1.5 font-semibold text-[12px]">
              All Items
            </TabsTrigger>
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="cursor-pointer px-3 py-1.5 font-semibold text-[12px]">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Quick Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items, vendors or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Library Grid or Skeletons */}
      {loading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Loading Sourcing Catalog
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex min-h-[300px] flex-col items-center justify-center border-dashed bg-background/30 p-8 text-center">
          <ShoppingBag className="mb-3 size-12 text-muted-foreground/40" />
          <h3 className="font-semibold text-lg">Library catalog empty</h3>
          <p className="mt-1 max-w-sm text-muted-foreground text-sm">
            {searchQuery
              ? "Try broadening your search query or clear the active category filter."
              : "Get started by adding high-end furniture or material swatches to your catalog."}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleOpenAdd}
              className="mt-4 flex items-center gap-2">
              <Plus className="size-4" />
              Add First Library Item
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid 3xl:grid-cols-8 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {filteredItems.map((item) => {
            const parentVendor = vendors.find(
              (v) => v.vendorId === item.vendorId,
            );
            const vendorName = parentVendor?.name || "Unknown Vendor";

            return (
              <Card
                key={item.itemId}
                className="group relative flex h-full flex-col overflow-hidden bg-card/60 pt-0 shadow-sm backdrop-blur-xs transition-all duration-300 hover:border-primary/20 hover:shadow-md">
                {/* Visual Thumbnail Area - Clicking/hovering on the image takes you to the detail page */}
                <Link
                  href={`/dashboard/library/${item.itemId}`}
                  className="group/img relative flex aspect-square w-full items-center justify-center overflow-hidden border-border/40 border-b bg-muted/40">
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.name}
                      className="h-full w-auto object-contain transition-transform duration-300 group-hover/img:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <ShoppingBag className="size-8 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Sourcing Category Tag */}
                  <Badge
                    variant="default"
                    className="absolute top-2.5 left-2.5 bg-black/50 font-bold text-[9px] text-white uppercase tracking-wider backdrop-blur-xs">
                    {item.category}
                  </Badge>
                </Link>

                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex-1">
                    {/* Item Name - Clicking/hovering on the title takes you to the detail page */}
                    <h3 className="line-clamp-1 font-heading font-semibold text-base leading-tight transition-colors">
                      <Link
                        href={`/dashboard/library/${item.itemId}`}
                        className="block transition-colors hover:text-primary">
                        {item.name}
                      </Link>
                    </h3>

                    {/* Vendor Name - Clicking on the vendor name filters the vendor profile in directory */}
                    <div className="mt-1 flex min-w-0 items-center gap-1 text-[12px] text-muted-foreground">
                      {item.vendorId ? (
                        parentVendor?.website ? (
                          <a
                            href={
                              parentVendor.website.startsWith("http")
                                ? parentVendor.website
                                : `https://${parentVendor.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 truncate font-medium text-foreground/80 hover:text-primary hover:underline">
                            {vendorName}
                            <ExternalLink className="ml-1 size-2.5 shrink-0" />
                          </a>
                        ) : (
                          <Link
                            href={`/dashboard/vendors/${item.vendorId}`}
                            className="flex items-center gap-0.5 truncate font-medium text-foreground/80 hover:text-primary hover:underline">
                            {vendorName}
                            <ExternalLink className="size-2.5 shrink-0" />
                          </Link>
                        )
                      ) : (
                        <span className="font-medium text-foreground/60">
                          {vendorName}
                        </span>
                      )}
                    </div>

                    {/* Product webpage link on vendor's site */}
                    {item.sourcingLink ? (
                      <a
                        href={
                          item.sourcingLink.startsWith("http")
                            ? item.sourcingLink
                            : `https://${item.sourcingLink}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1.5 py-0.5 font-medium text-[12px] text-primary transition-colors hover:underline">
                        <span className="truncate">Origin Link</span>
                        <ExternalLink className="size-2.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="mt-2 inline-flex max-w-full select-none items-center gap-1.5 rounded-md border border-border/20 bg-muted/20 px-2 py-0.5 font-normal text-[10px] text-muted-foreground/45 italic">
                        <span>No product link</span>
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  {/* Pricing Matrix summary */}
                  <div className="flex w-full items-center justify-between">
                    <div className="flex flex-col">
                      <Label className="mb-1">Cost</Label>
                      <span className="font-semibold text-foreground/75 text-sm">
                        {formatCurrency(item.unitCost)}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <Label className="mb-1 ml-auto">Selling Price</Label>
                      <span className="font-bold text-primary text-sm">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Calculated Margin indicators */}
                  {(() => {
                    const profitable = item.sellingPrice > item.unitCost;
                    return (
                      <Badge
                        variant={profitable ? "profit" : "warning"}
                        className="mx-auto mt-3 -mb-1 gap-1">
                        {profitable ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <TrendingDown className="size-3" />
                        )}
                        <span className="font-semibold">
                          {Math.round(item.markup)}%
                        </span>
                        <span>markup</span>
                      </Badge>
                    );
                  })()}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <LibraryItemFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Add Item Specifications"
        submitLabel="Add Catalog Item"
        submitting={submitting}
        onSubmit={handleSubmit}
        form={form}
        vendors={vendors}
        onQuickAddVendor={() => setIsVendorDialogOpen(true)}
      />

      <QuickVendorDialog
        open={isVendorDialogOpen}
        onOpenChange={setIsVendorDialogOpen}
        onCreated={(vendor) => {
          setVendors((prev) => [vendor, ...prev]);
          form.setValue("vendorId", vendor.vendorId, { shouldValidate: true });
        }}
      />
    </div>
  );
}
