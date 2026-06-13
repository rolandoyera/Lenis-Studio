"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ExternalLink, Loader2, Plus, Search, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth-context";
import { DashboardImage } from "@/components/dashboard-image";
import { PageTitle } from "@/components/page-title-updater";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H1, H3 } from "@/components/ui/typography";
import { addLibraryItem, getLibraryItems, getVendors } from "@/lib/db";
import { mirrorExternalImagesToFirebase } from "@/lib/library-image-mirror";
import type { LibraryItem, Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { CATEGORIES, SUBCATEGORIES } from "./_components/library-constants";
import { LibraryItemFormDialog } from "./_components/library-item-form-dialog";
import { QuickVendorDialog } from "./_components/quick-vendor-dialog";
import { useLibraryItemForm } from "./_components/use-library-item-form";

export default function LibraryPage() {
  const { profile, loading: authLoading } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");

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
        const [itemsData, vendorsData] = await Promise.all([getLibraryItems(orgId), getVendors(orgId)]);
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
      const { imageUrls, coverImageUrl, coverImagePath, images } = await mirrorExternalImagesToFirebase(
        {
          imageUrls: form.formData.imageUrls,
          coverImageUrl: form.formData.coverImageUrl,
          coverImagePath: form.formData.coverImagePath,
          images: form.formData.images,
        },
        form.tempItemId,
      );
      const created = await addLibraryItem(
        {
          ...form.formData,
          imageUrls,
          coverImageUrl,
          coverImagePath,
          images,
          organizationId: profile.organizationId,
        },
        form.tempItemId,
      );
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

    const matchesCategory = activeCategory === "All" || item.category === activeCategory;

    const matchesSubcategory =
      activeCategory === "All" || activeSubcategory === "All" || item.subcategory === activeSubcategory;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const isSubcategoryVisible = activeCategory !== "All" && SUBCATEGORIES[activeCategory] !== undefined;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageTitle title="Product Library" />
      {/* Header section with Premium typography & Action trigger */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H1>Product Library</H1>
          <p className="mt-1 text-muted-foreground text-sm">
            Global catalog of furniture, fabric swatches, stone slabs, lighting structures, and bespoke services.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 sm:self-start"
        >
          <Plus className="size-4" />
          Add Item to Library
        </Button>
      </div>

      {/* Filter and search controls combined into a clean layout */}
      <div className="flex flex-col items-center justify-between gap-4 border-b pb-4 md:flex-row">
        {/* Category filter: tabs on very wide screens, dropdown below 3xl */}
        <div className="3xl:flex hidden w-full flex-col md:w-auto">
          <Tabs
            value={activeCategory}
            onValueChange={(val) => {
              setActiveCategory(val);
              setActiveSubcategory("All");
            }}
            className="w-full"
          >
            <TabsList className="flex max-w-full flex-wrap gap-0.5">
              <TabsTrigger value="All">All Categories</TabsTrigger>
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div
            className="grid transition-all duration-200 ease-in-out"
            style={{
              gridTemplateRows: isSubcategoryVisible ? "1fr" : "0fr",
              opacity: isSubcategoryVisible ? 1 : 0,
              marginTop: isSubcategoryVisible ? "1rem" : "0rem",
            }}
          >
            <div className="overflow-hidden">
              <Tabs value={activeSubcategory} onValueChange={setActiveSubcategory} className="w-full">
                <TabsList className="flex max-w-full flex-wrap gap-0.5">
                  <TabsTrigger value="All">All {activeCategory}</TabsTrigger>
                  {isSubcategoryVisible &&
                    SUBCATEGORIES[activeCategory].map((sub) => (
                      <TabsTrigger key={sub} value={sub}>
                        {sub}
                      </TabsTrigger>
                    ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex 3xl:hidden w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Select
            value={activeCategory}
            onValueChange={(val) => {
              setActiveCategory(val);
              setActiveSubcategory("All");
            }}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeCategory !== "All" && SUBCATEGORIES[activeCategory] && (
            <Select value={activeSubcategory} onValueChange={setActiveSubcategory}>
              <SelectTrigger className="fade-in w-full animate-in duration-200 md:w-[220px]">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Subcategories</SelectItem>
                {SUBCATEGORIES[activeCategory].map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Loading Catalog</p>
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
            <Button onClick={handleOpenAdd} className="mt-4 flex items-center gap-2">
              <Plus className="size-4" />
              Add First Library Item
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid 3xl:grid-cols-7 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {filteredItems.map((item) => {
            const parentVendor = vendors.find((v) => v.vendorId === item.vendorId);
            const vendorName = parentVendor?.name || "Unknown Vendor";

            return (
              <Card
                key={item.itemId}
                className="group relative flex h-full flex-col overflow-hidden pt-0 shadow-sm transition-all duration-200 has-[.detail-link:hover]:-translate-y-0.5 has-[.detail-link:hover]:border-primary/30 has-[.detail-link:hover]:shadow-md"
              >
                {/* Visual Thumbnail Area */}
                <Link
                  href={`/dashboard/library/${item.itemId}`}
                  className="detail-link relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden border-border/40 border-b bg-muted/40"
                >
                  {item.coverImageUrl ? (
                    <DashboardImage
                      src={item.coverImageUrl}
                      alt={item.name}
                      sizes="(min-width: 1536px) 14vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <ShoppingBag className="size-8 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Sourcing Category & Subcategory Tags */}
                  <div className="absolute top-2 left-2.5 flex items-center gap-1.5">
                    <Badge
                      variant="default"
                      className="bg-black/50 text-[8px] text-white uppercase tracking-wider backdrop-blur-xs"
                    >
                      {item.category}
                    </Badge>
                    {item.subcategory && (
                      <Badge
                        variant="default"
                        className="bg-black/50 text-[8px] text-white uppercase tracking-wider backdrop-blur-xs"
                      >
                        {item.subcategory}
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex-1">
                    {/* Item Name - Clicking/hovering on the title takes you to the detail page */}
                    <H3 className="transition-colors group-has-[.detail-link:hover]:text-primary">
                      <Link href={`/dashboard/library/${item.itemId}`} className="detail-link block">
                        {item.name}
                      </Link>
                    </H3>

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
                            className="flex items-center gap-0.5 truncate font-medium text-foreground/80 hover:text-primary hover:underline"
                          >
                            {vendorName}
                            <ExternalLink className="ml-1 size-2.5 shrink-0" />
                          </a>
                        ) : (
                          <Link
                            href={`/dashboard/vendors/${item.vendorId}`}
                            className="flex items-center gap-0.5 truncate font-medium text-foreground/80 hover:text-primary hover:underline"
                          >
                            {vendorName}
                            <ExternalLink className="size-2.5 shrink-0" />
                          </Link>
                        )
                      ) : (
                        <span className="font-medium text-foreground/60">{vendorName}</span>
                      )}
                    </div>

                    {/* Product webpage link on vendor's site */}
                    {item.sourcingLink ? (
                      <a
                        href={item.sourcingLink.startsWith("http") ? item.sourcingLink : `https://${item.sourcingLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1.5 py-0.5 font-medium text-[12px] text-primary transition-colors hover:underline"
                      >
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
                      <span className="font-semibold text-foreground/75 text-sm">{formatCurrency(item.unitCost)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <Label className="mb-1 ml-auto">Selling Price</Label>
                      <span className="font-bold text-primary text-sm">{formatCurrency(item.sellingPrice)}</span>
                    </div>
                  </div>

                  {/* Calculated Margin indicators */}
                  {(() => {
                    const profitable = item.sellingPrice > item.unitCost;
                    return (
                      <Badge variant={profitable ? "profit" : "warning"} className="mx-auto mt-3 -mb-1 gap-1">
                        {profitable ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        <span className="font-semibold">{Math.round(item.markup)}%</span>
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
