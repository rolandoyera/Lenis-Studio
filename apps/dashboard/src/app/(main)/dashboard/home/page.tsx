import { UserGreeting } from "../_components/user-greeting";
import { WeatherWidget } from "../_components/weather-widget";
import { MetricCards } from "./_components/metric-cards";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col mb-6">
        <h1 className="text-4xl tracking-tight flex flex-wrap items-center gap-3">
          <UserGreeting prefix="Hello" />
          <WeatherWidget />
        </h1>
        <p className="text-muted-foreground text-sm">Here's what's happening in the studio today.</p>
      </div>
      <MetricCards />
      <PerformanceOverview />
      <SubscriberOverview />
    </div>
  );
}
