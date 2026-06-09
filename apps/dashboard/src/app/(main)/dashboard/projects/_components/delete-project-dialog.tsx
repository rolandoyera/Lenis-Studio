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

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  deleting: boolean;
  onConfirm: () => void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  deleting,
  onConfirm,
}: DeleteProjectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-popover/95 backdrop-blur-md sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This action cannot be undone. This will permanently delete the project space{" "}
            <span className="font-medium text-foreground">{projectName}</span>.
            <span className="mt-2 block font-medium text-amber-600">
              (Proposals mapped to this project will remain in the system, but will be detached from this project
              space).
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
            Delete Project Space
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
