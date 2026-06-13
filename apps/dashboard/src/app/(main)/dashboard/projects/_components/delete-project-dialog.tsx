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
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="mt-4 text-sm">
            This action cannot be undone. This will permanently delete the project{" "}
            <span className="font-medium text-foreground">{projectName}</span>.
            <span className="mt-2 block font-medium text-amber-600">
              (Proposals linked to this project will remain in the system, but will be detached from this project).
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={deleting}
            className="flex cursor-pointer items-center gap-1.5"
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
