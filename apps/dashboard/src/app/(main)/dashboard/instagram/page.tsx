import Link from "next/link";

import PageHeader from "@/components/page-header";
import { PageTitle } from "@/components/page-title-updater";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getMetaConnection } from "@/server/meta-actions";

import { InstagramDemographics } from "./_components/instagram-demographics";
import { InstagramHeadlineCards } from "./_components/instagram-headline-cards";
import { InstagramKpiStrip } from "./_components/instagram-kpi-strip";
import { InstagramReachTrend } from "./_components/instagram-reach-trend";
import { InstagramRecentPosts } from "./_components/instagram-recent-posts";
import { InstagramRefreshButton } from "./_components/instagram-refresh-button";
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
        <PageHeader
          title="Instagram"
          description="How clients discover and interact with your brand on Instagram."
          titleAccessory={
            <span
              role="img"
              className="relative flex size-2.5"
              title={meta ? "Connected" : "Not connected"}
              aria-label={meta ? "Connected" : "Not connected"}
            >
              <span
                className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                  meta ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className={`relative inline-flex size-2.5 rounded-full ${meta ? "bg-green-500" : "bg-red-500"}`} />
            </span>
          }
        />
        {meta ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="size-9">
              <AvatarImage src={meta.instagramProfilePictureUrl} alt={meta.instagramUsername} />
              <AvatarFallback>{meta.instagramUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-card-foreground text-sm">@{meta.instagramUsername}</span>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link href="/dashboard/company">Connect Instagram</Link>
          </Button>
        )}
      </div>

      {meta && (
        <InstagramTabs
          overview={
            <>
              <InstagramHeadlineCards followersCount={meta.followersCount} />

              <div className="flex justify-end gap-2">
                <InstagramRefreshButton />
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
