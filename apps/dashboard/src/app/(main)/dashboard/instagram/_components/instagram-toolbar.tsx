"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MarketingToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRange = searchParams.get("range") || "last-30-days";

  const handleRangeChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentRange} onValueChange={handleRangeChange}>
      <SelectTrigger className="w-34" size="sm">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="last-7-days">Last 7 days</SelectItem>
          <SelectItem value="last-14-days">Last 14 days</SelectItem>
          <SelectItem value="last-30-days">Last 30 days</SelectItem>
          <SelectItem value="last-60-days">Last 60 days</SelectItem>
          <SelectItem value="last-90-days">Last 90 days</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
