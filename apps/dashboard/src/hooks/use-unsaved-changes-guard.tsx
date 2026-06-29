"use client";

import { type ReactNode, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Save } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface UseUnsavedChangesGuardOptions {
  /** While true, in-app link clicks and browser exits are intercepted. */
  when: boolean;
  /**
   * Optional "Save & leave" action. Resolve `true` to proceed with navigation,
   * `false` to keep the dialog open (e.g. the save failed — surface why via a
   * toast). Should not reject. Omit to offer only Discard / Stay.
   */
  onSave?: () => Promise<boolean>;
  title?: string;
  description?: string;
  saveLabel?: string;
  discardLabel?: string;
  stayLabel?: string;
}

/**
 * Guards against losing unsaved work. The hook itself renders nothing — drop the
 * returned `dialog` into your tree. It covers browser-level exits (beforeunload)
 * and, since App Router can't block client-side route changes, in-app soft
 * navigation via a capture-phase anchor-click interceptor: any internal link
 * (sidebar, back link, anywhere) is blocked and a Stay / Discard / Save & leave
 * dialog opens instead, then navigates with `router.push` on the user's choice.
 */
export function useUnsavedChangesGuard({
  when,
  onSave,
  title = "Save your changes?",
  description = "You have unsaved changes. Save them before you leave, or discard them.",
  saveLabel = "Save & leave",
  discardLabel = "Discard",
  stayLabel = "Stay",
}: UseUnsavedChangesGuardOptions): { dialog: ReactNode } {
  const router = useRouter();
  // The intercepted destination. `back` mirrors a HeaderBackLink click — navigate
  // via history rather than pushing `href` — so "Go Back" returns to the page the
  // user actually came from instead of the link's static fallback target.
  const [pendingNav, setPendingNav] = useState<{
    href: string;
    back: boolean;
  } | null>(null);
  const [leaving, setLeaving] = useState(false);

  const navigate = (nav: { href: string; back: boolean }) => {
    if (nav.back) router.back();
    else router.push(nav.href);
  };

  // Browser-level exits (tab close, refresh, typed URL, hard nav).
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);

  // In-app soft navigation: intercept internal anchor clicks in the capture
  // phase (before React/Next handle them), block them, and open the dialog.
  useEffect(() => {
    if (!when) return;
    const onCaptureClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return; // let modified / new-tab clicks behave normally
      }
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      const href = anchor?.getAttribute("href");
      if (
        !anchor ||
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      const dest = new URL(href, window.location.href);
      // Ignore external links and same-page navigation.
      if (
        dest.origin !== window.location.origin ||
        (dest.pathname === window.location.pathname &&
          dest.search === window.location.search)
      ) {
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      // A back link prefers history.back() — but only when there's history to
      // return to, matching HeaderBackLink's own guard; otherwise fall to href.
      const back =
        anchor.hasAttribute("data-back-link") && window.history.length > 1;
      setPendingNav({
        href: `${dest.pathname}${dest.search}${dest.hash}`,
        back,
      });
    };
    document.addEventListener("click", onCaptureClick, true);
    return () => document.removeEventListener("click", onCaptureClick, true);
  }, [when]);

  const leaveWithoutSaving = () => {
    const nav = pendingNav;
    setPendingNav(null);
    if (nav) navigate(nav);
  };

  const saveAndLeave = async () => {
    if (!onSave) return;
    setLeaving(true);
    try {
      const ok = await onSave();
      if (!ok) return; // keep the dialog open; caller surfaced why
      const nav = pendingNav;
      setPendingNav(null);
      if (nav) navigate(nav);
    } finally {
      setLeaving(false);
    }
  };

  const dialog = (
    <AlertDialog
      open={pendingNav !== null}
      onOpenChange={(open) => {
        if (!open && !leaving) setPendingNav(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={leaving}>{stayLabel}</AlertDialogCancel>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={leaving}
            onClick={leaveWithoutSaving}
          >
            {discardLabel}
          </Button>
          {onSave && (
            <Button
              disabled={leaving}
              onClick={() => {
                void saveAndLeave();
              }}
            >
              {leaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saveLabel}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { dialog };
}
