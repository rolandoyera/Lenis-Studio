import { AlertCircle } from "lucide-react";
import Link from "next/link";

import PageHeader from "@/components/page-header";
import { PageTitle } from "@/components/page-title-updater";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMetaConnection } from "@/server/meta-actions";

import { InstagramDemographics } from "./_components/instagram-demographics";
import { InstagramHeadlineCards } from "./_components/instagram-headline-cards";
import { InstagramKpiStrip } from "./_components/instagram-kpi-strip";
import { InstagramReachTrend } from "./_components/instagram-reach-trend";
import { InstagramRecentPosts } from "./_components/instagram-recent-posts";
import { InstagramPostsGrid } from "./_components/instagram-posts-grid";
import { InstagramTabs } from "./_components/instagram-tabs";
import { InstagramToolbar } from "./_components/instagram-toolbar";

export default async function Page({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "last-30-days" } = await searchParams;
  const meta = await getMetaConnection();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Instagram" />
      <div className="flex items-center justify-between">
        <PageHeader title="Instagram" description="How clients discover and interact with your brand on Instagram." />
        {meta && (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="size-9">
              <AvatarImage src={meta.instagramProfilePictureUrl} alt={meta.instagramUsername} />
              <AvatarFallback>{meta.instagramUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-card-foreground text-sm">@{meta.instagramUsername}</span>
          </div>
        )}
      </div>

      {!meta ? (
        <Card className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4" />
            </div>
            <div>
              <p className="font-medium text-sm">Instagram not connected</p>
              <p className="text-muted-foreground text-xs">
                Connect an Instagram Business account to see analytics here.
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/company">Connect Instagram</Link>
          </Button>
        </Card>
      ) : (
        <InstagramTabs
          overview={
            <>
              <InstagramHeadlineCards followersCount={meta.followersCount} />

              <div className="flex justify-end">
                <InstagramToolbar />
              </div>

              <InstagramKpiStrip range={range} />

              <div className="grid gap-6 lg:grid-cols-1">
                <InstagramReachTrend range={range} />
                <InstagramRecentPosts />
              </div>
            </>
          }
          posts={<InstagramPostsGrid />}
          audience={<InstagramDemographics />}
        />
      )}
    </div>
  );
}
