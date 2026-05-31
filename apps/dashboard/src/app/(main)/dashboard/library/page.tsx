"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ExternalLink, Loader2, Plus, Search, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addLibraryItem, getLibraryItems, getVendors } from "@/lib/db";
import type { LibraryItem, Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { CATEGORIES } from "./_components/library-constants";
import { LibraryItemFormDialog } from "./_components/library-item-form-dialog";
import { QuickVendorDialog } from "./_components/quick-vendor-dialog";
import { useLibraryItemForm } from "./_components/use-library-item-form";

export default function LibraryPage() {
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
    async function loadData() {
      try {
        const [itemsData, vendorsData] = await Promise.all([getLibraryItems(), getVendors()]);
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
  }, []);

  const handleOpenAdd = () => {
    form.reset();
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const created = await addLibraryItem(form.formData);
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

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header section with Premium typography & Action trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Product & Material Library</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Global catalog of furniture, fabric swatches, stone slabs, lighting structures, and bespoke services.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="sm:self-start bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-2"
        >
          <Plus className="size-4" />
          Add Item to Library
        </Button>
      </div>

      {/* Filter and search controls combined into a clean layout */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b pb-4">
        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
          <TabsList className="flex flex-wrap h-auto! gap-0.5 max-w-full">
            <TabsTrigger value="All" className="text-[12px] font-semibold px-3 py-1.5 cursor-pointer">
              All Items
            </TabsTrigger>
            {CATEGORIES.map((cat) => (
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
            placeholder="Search items, vendors or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Library Grid or Skeletons */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Loading Sourcing Catalog</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] border-dashed text-center p-8 bg-background/30">
          <ShoppingBag className="size-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold text-lg">Library catalog empty</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-6">
          {filteredItems.map((item) => {
            const parentVendor = vendors.find((v) => v.vendorId === item.vendorId);
            const vendorName = parentVendor?.name || "Unknown Vendor";

            return (
              <Card
                key={item.itemId}
                className="group relative overflow-hidden flex flex-col h-full transition-all shadow-sm duration-300 hover:shadow-md hover:border-primary/20 bg-card/60 backdrop-blur-xs pt-0"
              >
                {/* Visual Thumbnail Area - Clicking/hovering on the image takes you to the detail page */}
                <Link
                  href={`/dashboard/library/${item.itemId}`}
                  className="relative aspect-square w-full overflow-hidden bg-muted/40 border-b border-border/40 flex items-center justify-center group/img"
                >
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.name}
                      className="h-full w-auto object-contain group-hover/img:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      <ShoppingBag className="size-8 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Sourcing Category Tag */}
                  <Badge
                    variant="default"
                    className="absolute top-2.5 left-2.5 text-[9px] font-bold tracking-wider uppercase bg-black/50 text-white backdrop-blur-xs"
                  >
                    {item.category}
                  </Badge>
                </Link>

                <CardContent className="flex flex-col flex-1 gap-3">
                  <div className="flex-1">
                    {/* Item Name - Clicking/hovering on the title takes you to the detail page */}
                    <h3 className="font-heading font-semibold text-base line-clamp-1 leading-tight transition-colors">
                      <Link
                        href={`/dashboard/library/${item.itemId}`}
                        className="hover:text-primary transition-colors block"
                      >
                        {item.name}
                      </Link>
                    </h3>

                    {/* Vendor Name - Clicking on the vendor name filters the vendor profile in directory */}
                    <div className="mt-1 text-[12px] text-muted-foreground flex items-center gap-1 min-w-0">
                      <span className="shrink-0">Vendor:</span>
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
                            className="font-medium text-foreground/80 hover:text-primary hover:underline truncate flex items-center gap-0.5"
                          >
                            {vendorName}
                            <ExternalLink className="size-2.5 inline-block shrink-0 opacity-60" />
                          </a>
                        ) : (
                          <Link
                            href={`/dashboard/vendors/${item.vendorId}`}
                            className="font-medium text-foreground/80 hover:text-primary hover:underline truncate flex items-center gap-0.5"
                          >
                            {vendorName}
                            <ExternalLink className="size-2.5 inline-block shrink-0 opacity-60" />
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
                        className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-medium text-primary hover:underline transition-colors pr-2 py-0.5 max-w-full"
                      >
                        <span className="truncate">Item Webpage</span>
                        <ExternalLink className="size-2.5 shrink-0" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-normal text-muted-foreground/45 bg-muted/20 px-2 py-0.5 rounded-md border border-border/20 max-w-full select-none italic">
                        <span>No product link</span>
                      </span>
                    )}
                  </div>

                  {/* Pricing Matrix summary */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <div className="flex flex-col">
                      <Label className="mb-1">Cost</Label>
                      <span className="text-sm font-semibold text-foreground/75 font-mono">
                        {formatCurrency(item.unitCost)}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <Label className="mb-1 ml-auto">Selling Price</Label>
                      <span className="text-sm font-bold text-primary font-mono">
                        {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Calculated Margin indicators */}
                  {(() => {
                    const profitable = item.sellingPrice > item.unitCost;
                    return (
                      <Badge variant={profitable ? "profit" : "warning"} className="ml-auto gap-1">
                        {profitable ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        <span className="font-semibold">{Math.round(item.markup)}%</span>
                        <span>markup</span>
                      </Badge>
                    );
                  })()}
                </CardContent>
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
