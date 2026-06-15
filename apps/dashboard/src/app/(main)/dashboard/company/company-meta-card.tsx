"use client";

import { CircleCheckIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { disconnectMeta, selectMetaPage } from "@/server/meta-actions";
import type { MetaIntegrationConfig, MetaPendingPage } from "@/types/meta";

export function CompanyMetaCard({
  connection,
  pendingPages,
  justConnected,
}: {
  connection: MetaIntegrationConfig | null;
  pendingPages: MetaPendingPage[];
  justConnected: boolean;
}) {
  const [account, setAccount] = useState<MetaIntegrationConfig | null>(connection);
  const [successOpen, setSuccessOpen] = useState(justConnected && connection !== null);
  const [pickerOpen, setPickerOpen] = useState(pendingPages.length > 0);
  const [isPending, startTransition] = useTransition();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // URL hygiene: drop the ?meta=… param so a reload doesn't re-trigger dialogs.
  useEffect(() => {
    if (justConnected || pendingPages.length > 0) {
      window.history.replaceState(null, "", "/dashboard/company");
    }
  }, [justConnected, pendingPages.length]);

  function choose(pageId: string) {
    setSelecting(pageId);
    setError(null);
    startTransition(async () => {
      const res = await selectMetaPage(pageId);
      if (res.success && res.connection) {
        setAccount(res.connection);
        setPickerOpen(false);
        setSelecting(null);
        setSuccessOpen(true);
      } else {
        setError(res.error ?? "Something went wrong.");
        setSelecting(null);
      }
    });
  }

  function disconnect() {
    startTransition(async () => {
      const res = await disconnectMeta();
      if (res.success) setAccount(null);
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Instagram</CardTitle>
          <CardDescription>Connect your Instagram Business account to track analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          {account ? (
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarImage src={account.instagramProfilePictureUrl} alt={account.instagramUsername} />
                <AvatarFallback>{account.instagramUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">@{account.instagramUsername}</span>
                  <div className="flex h-5 items-center">
                    <Badge variant="success">Connected</Badge>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {account.followersCount.toLocaleString()} followers · {account.mediaCount} posts
                </p>
              </div>
              <Button variant="outline" size="sm" disabled={isPending} onClick={disconnect}>
                {isPending ? "Disconnecting…" : "Disconnect"}
              </Button>
            </div>
          ) : (
            <Button asChild>
              <a href="/api/integrations/meta/login">Connect Instagram</a>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Success confirmation */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CircleCheckIcon className="size-6" />
              </span>
              <DialogTitle>Instagram connected</DialogTitle>
              <DialogDescription>
                {account
                  ? `@${account.instagramUsername} is now linked. You can track its analytics here.`
                  : "Your Instagram account is now linked."}
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account picker (multiple Pages granted) */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose an account</DialogTitle>
            <DialogDescription>
              You granted access to multiple Pages. Pick the Instagram account you want to track.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {pendingPages.map((page) => (
              <div key={page.pageId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar>
                  <AvatarFallback>{(page.instagramUsername ?? page.pageName).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{page.pageName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {page.hasInstagram
                      ? `@${page.instagramUsername} · ${(page.followersCount ?? 0).toLocaleString()} followers`
                      : "No Instagram account linked"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!page.hasInstagram || isPending}
                  onClick={() => choose(page.pageId)}
                >
                  {selecting === page.pageId ? "Connecting…" : "Select"}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
