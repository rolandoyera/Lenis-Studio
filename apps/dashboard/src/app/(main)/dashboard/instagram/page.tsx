import { AlertCircle } from "lucide-react";
import Link from "next/link";

import PageHeader from "@/components/page-header";
import { PageTitle } from "@/components/page-title-updater";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMetaConnection } from "@/server/meta-actions";

import { InstagramDemographics } from "./_components/instagram-demographics";
import { InstagramKpiStrip } from "./_components/instagram-kpi-strip";
import { InstagramReachTrend } from "./_components/instagram-reach-trend";
import { InstagramRecentPosts } from "./_components/instagram-recent-posts";
import { InstagramPostsGrid } from "./_components/instagram-posts-grid";
import { MarketingTabs } from "./_components/marketing-tabs";
import { MarketingToolbar } from "./_components/marketing-toolbar";

export default async function Page({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "last-30-days" } = await searchParams;
  const meta = await getMetaConnection();

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Marketing" />
      <PageHeader title="Marketing" description="How clients discover and interact with your brand on Instagram." />

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
        <>
          <Card className="flex items-center gap-3 p-4">
            <Avatar>
              <AvatarImage src={meta.instagramProfilePictureUrl} alt={meta.instagramUsername} />
              <AvatarFallback>{meta.instagramUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">@{meta.instagramUsername}</span>
                <div className="flex h-5 items-center">
                  <Badge variant="success">Connected</Badge>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {meta.followersCount.toLocaleString()} followers · {meta.mediaCount} posts
              </p>
            </div>
          </Card>

          <MarketingTabs
            toolbar={<MarketingToolbar />}
            overview={
              <>
                <InstagramKpiStrip range={range} />

                <div className="grid gap-6 lg:grid-cols-2">
                  <InstagramReachTrend range={range} />
                  <InstagramRecentPosts />
                </div>
              </>
            }
            posts={<InstagramPostsGrid />}
            audience={<InstagramDemographics />}
          />
        </>
      )}
    </div>
  );
}
