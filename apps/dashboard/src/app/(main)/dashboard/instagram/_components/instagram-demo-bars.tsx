"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface DemoBarItem {
  label: string;
  value: number;
  /** Optional full name shown on hover (e.g. country code -> country name). */
  tooltip?: string;
}

export function InstagramDemoBars({ items }: { items: DemoBarItem[] }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-muted-foreground text-sm">No data yet.</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 px-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded bg-primary/15"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
              {item.tooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="absolute inset-y-0 left-2 flex cursor-default items-center text-xs">
                      {item.label}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{item.tooltip}</TooltipContent>
                </Tooltip>
              ) : (
                <span className="absolute inset-y-0 left-2 flex items-center text-xs">{item.label}</span>
              )}
            </div>
            <span className="w-10 text-right text-muted-foreground text-xs tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
