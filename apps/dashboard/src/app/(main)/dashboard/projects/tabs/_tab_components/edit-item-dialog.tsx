"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateProjectRoomItem } from "@/lib/db";
import type { ProjectRoomItem } from "@/lib/types";

import {
  CATEGORIES,
  SUBCATEGORIES,
  UNIT_TYPES,
} from "../../../library/_components/library-constants";

// ----------------------------------------------------
// Validation Schema — the editable fields of a project room item.
// ----------------------------------------------------
const editItemSchema = z.object({
  name: z.string().min(1, "Item name is required."),
  sku: z.string().optional(),
  category: z.string().min(1, "Category is required."),
  subcategory: z.string().optional(),
  sourcingLink: z.string().optional(),
  unitType: z.enum(UNIT_TYPES, { error: "Unit type is required." }),
  materials: z.string().optional(),
  finishColor: z.string().optional(),
  dimensions: z.string().optional(),
  description: z.string().optional(),
  unitCost: z.number().min(0, "Cost must be positive."),
  markup: z.number().min(0, "Markup must be positive."),
  sellingPrice: z.number().min(0, "Price must be positive."),
  quantity: z.number().min(1, "Quantity must be at least 1."),
});

type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemDialogProps {
  item: ProjectRoomItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({
  item,
  open,
  onOpenChange,
}: EditItemDialogProps) {
  const form = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema) as Resolver<EditItemFormData>,
    defaultValues: {
      name: item.name,
      sku: item.sku ?? "",
      category: item.category,
      subcategory: item.subcategory ?? "",
      sourcingLink: item.sourcingLink ?? "",
      unitType: item.unitType,
      materials: item.materials ?? "",
      finishColor: item.finishColor ?? "",
      dimensions: item.dimensions ?? "",
      description: item.description ?? "",
      unitCost: item.unitCost,
      markup: item.markup,
      sellingPrice: item.sellingPrice,
      quantity: item.quantity,
    },
  });

  // Re-seed the form whenever a different item is opened for editing.
  useEffect(() => {
    form.reset({
      name: item.name,
      sku: item.sku ?? "",
      category: item.category,
      subcategory: item.subcategory ?? "",
      sourcingLink: item.sourcingLink ?? "",
      unitType: item.unitType,
      materials: item.materials ?? "",
      finishColor: item.finishColor ?? "",
      dimensions: item.dimensions ?? "",
      description: item.description ?? "",
      unitCost: item.unitCost,
      markup: item.markup,
      sellingPrice: item.sellingPrice,
      quantity: item.quantity,
    });
  }, [item, form]);

  const formData = form.watch();

  // Keep cost / markup / selling price in sync, mirroring the add-item form.
  const handleUnitCostChange = (val: number) => {
    const sellingPrice = Number((val * (1 + formData.markup / 100)).toFixed(2));
    form.setValue("unitCost", val);
    form.setValue("sellingPrice", sellingPrice);
  };

  const handleMarkupChange = (val: number) => {
    const sellingPrice = Number(
      (formData.unitCost * (1 + val / 100)).toFixed(2),
    );
    form.setValue("markup", val);
    form.setValue("sellingPrice", sellingPrice);
  };

  const handleSellingPriceChange = (val: number) => {
    const cost = formData.unitCost;
    const markup =
      cost > 0
        ? Number((((val - cost) / cost) * 100).toFixed(2))
        : formData.markup;
    form.setValue("sellingPrice", val);
    form.setValue("markup", markup);
  };

  const onSubmit = async (data: EditItemFormData) => {
    try {
      await updateProjectRoomItem(item.roomItemId, data);
      toast.success(`"${data.name}" updated!`);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update item.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] flex-col overflow-hidden bg-popover/97 p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-primary" />
            Edit Item
          </DialogTitle>
          <DialogDescription className="ml-7">
            Update this item's details and pricing.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <div>
              <h3 className="mb-4 border-b pb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Primary Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>
                        Item Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="e.g. Modernist Solid Walnut Sofa"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="sku"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>SKU / Model Number</Label>
                      <Input placeholder="e.g. SF-WL-01" {...field} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("subcategory", "");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat: string) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="subcategory"
                  render={({ field, fieldState }) => {
                    const activeCategory = formData.category;
                    const subs = activeCategory
                      ? SUBCATEGORIES[activeCategory] || []
                      : [];
                    return (
                      <Field
                        className="flex flex-col gap-1.5"
                        data-invalid={fieldState.invalid}
                      >
                        <Label>Subcategory</Label>
                        <Select
                          value={field.value}
                          disabled={!activeCategory || subs.length === 0}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {subs.map((sub: string) => (
                              <SelectItem key={sub} value={sub}>
                                {sub}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 border-b pb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Physical Specs & Links
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  control={form.control}
                  name="sourcingLink"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>Sourcing Link</Label>
                      <Input placeholder="https://..." {...field} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="unitType"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>Unit Type</Label>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Unit Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_TYPES.map((u: string) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="materials"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>Materials</Label>
                      <Input
                        placeholder="e.g. Solid Oak, Bouclé Fabric"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="finishColor"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>Finish / Color</Label>
                      <Input placeholder="e.g. Walnut, Cream" {...field} />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="dimensions"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>Dimensions</Label>
                      <Input
                        placeholder='e.g. 84" W x 38" D x 32" H'
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <div className="mt-4">
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label>Sourcing & PO Description</Label>
                      <Textarea
                        placeholder="Item specifications details..."
                        className="min-h-[80px]"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 border-b pb-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Financial Specifications
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-unit-cost">Unit Cost ($)</Label>
                  <Input
                    id="edit-unit-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) =>
                      handleUnitCostChange(Number(e.target.value))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-markup">Markup (%)</Label>
                  <Input
                    id="edit-markup"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.markup}
                    onChange={(e) => handleMarkupChange(Number(e.target.value))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-selling-price">Selling Price ($)</Label>
                  <Input
                    id="edit-selling-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      handleSellingPriceChange(Number(e.target.value))
                    }
                    className="font-semibold text-primary"
                  />
                </div>
                <Controller
                  control={form.control}
                  name="quantity"
                  render={({ field, fieldState }) => (
                    <Field
                      className="flex flex-col gap-1.5"
                      data-invalid={fieldState.invalid}
                    >
                      <Label htmlFor="edit-item-qty">Quantity</Label>
                      <Input
                        id="edit-item-qty"
                        type="number"
                        min="1"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/10 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
