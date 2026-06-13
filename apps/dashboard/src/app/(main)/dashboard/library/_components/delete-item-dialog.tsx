"use client";

import { Loader2 } from "lucide-react";

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

interface DeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  deleting: boolean;
  onConfirm: () => void;
}

/** Confirmation alert for permanently deleting a library item. */
export function DeleteItemDialog({ open, onOpenChange, itemName, deleting, onConfirm }: DeleteItemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This action cannot be undone. This will permanently delete the product catalog item{" "}
            <span className="font-medium text-foreground">{itemName}</span> from the global studio library.
            <span className="mt-2 block font-medium text-amber-600">
              (All proposal listings referencing this global library item will remain intact, but will detach from this
              parent catalog source).
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={deleting}
            className="flex cursor-pointer items-center gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Delete Product
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
