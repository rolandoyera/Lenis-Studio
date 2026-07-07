"use client";

import { useEffect, useState } from "react";

import { ChevronRight, Folder, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { browseDropboxFolders } from "@/server/dropbox-actions";
import type { DropboxFolder } from "@/types/dropbox";

/**
 * Browses the connected org's Dropbox and links one folder to a project image
 * set. Navigation is folder-only (files are dropped server-side): click a row to
 * select it, click its chevron to drill in. `onLink` fires with the selected
 * folder; persistence lives in the parent (`project-settings.tsx`).
 */
export function DropboxFolderPicker({
  open,
  onOpenChange,
  setLabel,
  onLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setLabel: string;
  onLink: (folder: DropboxFolder) => Promise<void>;
}) {
  const [pathStack, setPathStack] = useState<DropboxFolder[]>([]);
  const [folders, setFolders] = useState<DropboxFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<DropboxFolder | null>(null);
  // The parent persists the link before resolving (the gallery's server fetch
  // must see it) — hold the dialog open with a spinner until that settles.
  const [linking, setLinking] = useState(false);

  // Root path is "" (not "/"); a drilled-in folder uses its path_lower.
  const currentPath = pathStack.length
    ? pathStack[pathStack.length - 1].path
    : "";

  // Reset to the Dropbox root each time the dialog opens.
  useEffect(() => {
    if (open) {
      setPathStack([]);
      setSelected(null);
    }
  }, [open]);

  // Load the folders at the current path whenever it changes (while open).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void browseDropboxFolders(currentPath).then((res) => {
      if (cancelled) return;
      if (res.success && res.folders) {
        setFolders(res.folders);
      } else {
        setFolders([]);
        setError(res.error ?? "Couldn't load folders.");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, currentPath]);

  const drillInto = (folder: DropboxFolder) => {
    setPathStack((prev) => [...prev, folder]);
    setSelected(null);
  };

  // index -1 = Dropbox root; otherwise truncate the stack to that segment.
  const jumpTo = (index: number) => {
    setPathStack((prev) => prev.slice(0, index + 1));
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Link folder — {setLabel}
          </p>
          <DialogTitle>Select a folder</DialogTitle>
          <div className="flex flex-wrap items-center gap-1 text-muted-foreground text-sm">
            <button
              type="button"
              onClick={() => jumpTo(-1)}
              className="hover:text-foreground"
            >
              Dropbox
            </button>
            {pathStack.map((folder, i) => (
              <span key={folder.path} className="flex items-center gap-1">
                <span>/</span>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className="max-w-40 truncate hover:text-foreground"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="-mx-4 h-80 border-y">
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-80 items-center justify-center px-4 text-center">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex h-80 items-center justify-center px-4 text-center">
              <p className="text-muted-foreground text-sm">
                No subfolders here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {folders.map((folder) => {
                const isSelected = selected?.path === folder.path;
                return (
                  <div
                    key={folder.path}
                    className={cn(
                      "flex items-center gap-2 px-4",
                      isSelected ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(folder)}
                      className="flex flex-1 items-center gap-3 py-2.5 text-left"
                    >
                      <Folder className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm">{folder.name}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Open ${folder.name}`}
                      onClick={() => drillInto(folder)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            {selected ? (
              <>
                Selected:{" "}
                <span className="text-foreground">{selected.name}</span>
              </>
            ) : (
              "Nothing selected — pick a folder above"
            )}
          </p>
          <Button
            disabled={!selected || linking}
            onClick={async () => {
              if (!selected) return;
              setLinking(true);
              try {
                await onLink(selected);
              } finally {
                setLinking(false);
              }
              onOpenChange(false);
            }}
          >
            {linking ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Link folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
