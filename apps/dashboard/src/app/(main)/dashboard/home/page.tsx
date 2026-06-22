import { PageTitle } from "@/components/page-title-updater";

import { UserGreeting } from "../_components/user-greeting";
import { WeatherWidget } from "../_components/weather-widget";
import { MetricCards } from "./_components/metric-cards";
import { PerformanceOverview } from "./_components/performance-overview";
import { RecentActivity } from "./_components/recent-activity";
import { SubscriberOverview } from "./_components/subscriber-overview";
import { H1, H3, P } from "@/components/ui/typography";

export default function Page() {
  return (
    <>
      <PageTitle title="Home" />
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-start justify-start gap-4">
          <div className="mb-6 flex flex-col gap-1">
            <H1 className="flex items-center gap-3">
              <UserGreeting prefix="Hello" />
            </H1>
            <P>Here's what's happening in the studio today.</P>
          </div>
          <WeatherWidget />
        </div>
        <MetricCards />
        <div className="flex flex-col gap-4 mt-4">
          <H3>Recent Activity</H3>
          <RecentActivity />
        </div>
        <PerformanceOverview />
        <SubscriberOverview />
      </div>
    </>
  );
}
