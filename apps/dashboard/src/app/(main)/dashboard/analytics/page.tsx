import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AcquisitionSection } from "./_components/acquisition-section";
import { AnalyticsKpiStrip } from "./_components/analytics-kpi-strip";
import { AnalyticsToolbar } from "./_components/analytics-toolbar";
import { AudienceSection } from "./_components/audience-section";
import { ConversionsSection } from "./_components/conversions-section";
import { GA4ConnectionChecker } from "./_components/ga4-connection-checker";
import { LandingPages } from "./_components/landing-pages";
import { RealtimeVisitors } from "./_components/realtime-visitors";
import { TopPages } from "./_components/top-pages";
import { TopTrafficSources } from "./_components/top-traffic-sources";
import { TrafficTrend } from "./_components/traffic-trend";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";
import PageHeader from "@/components/page-header";
import { PageTitle } from "@/components/page-title-updater";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const range = (resolvedSearchParams.range as string) || "last-24-hours";

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Analytics" />
      <PageHeader title="Analytics" description="Remove the guesswork and follow the data." />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <GA4ConnectionChecker />
      </div>

      <Tabs defaultValue="overview" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="conversions">Conversions</TabsTrigger>
          </TabsList>

          <AnalyticsToolbar />
        </div>

        <TabsContent value="overview" className="flex flex-col gap-6">
          <AnalyticsKpiStrip range={range} />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="md:col-span-1 lg:col-span-4">
              <TrafficTrend range={range} />
            </div>
            <div className="md:col-span-1 lg:col-span-3">
              <RealtimeVisitors />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="md:col-span-1 lg:col-span-4">
              <TopPages range={range} />
            </div>
            <div className="md:col-span-1 lg:col-span-3">
              <TopTrafficSources range={range} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audience">
          <AudienceSection range={range} />
        </TabsContent>

        <TabsContent value="acquisition">
          <AcquisitionSection range={range} />
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid gap-6 lg:grid-cols-2">
            <TopPages range={range} />
            <LandingPages range={range} />
          </div>
        </TabsContent>

        <TabsContent value="conversions">
          <ConversionsSection range={range} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
