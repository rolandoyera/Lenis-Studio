import { format } from "date-fns";

import { BalanceDistributionCard } from "./_components/balance-distribution-card";

export default function Page() {
  const formattedDate = format(new Date(), "EEEE, do MMMM yyyy");

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">Personal Finances</h1>
        <p className="text-muted-foreground text-sm">{formattedDate}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <BalanceDistributionCard />
        </div>
      </div>
    </div>
  );
}
