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

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  deleting: boolean;
  onConfirm: () => void;
}

/** Confirmation alert for permanently deleting a client profile. */
export function DeleteClientDialog({ open, onOpenChange, clientName, deleting, onConfirm }: DeleteClientDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-popover/95 backdrop-blur-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This action cannot be undone. This will permanently delete the client contact profile{" "}
            <span className="font-medium text-foreground">{clientName}</span> from the studio databases.
            <span className="mt-2 block font-medium text-amber-600">
              (Linked projects and proposals will remain, but the parent client reference association will be removed).
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
            Delete Client Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
