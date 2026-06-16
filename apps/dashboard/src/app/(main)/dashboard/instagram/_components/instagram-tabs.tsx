"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MarketingTabs({
  overview,
  posts,
  audience,
  toolbar,
}: {
  overview: React.ReactNode;
  posts: React.ReactNode;
  audience: React.ReactNode;
  toolbar: React.ReactNode;
}) {
  const [tab, setTab] = useState("overview");

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
        </TabsList>

        {/* Range only applies to the Overview metrics — hide it on the lifetime-data tabs. */}
        {tab === "overview" ? toolbar : null}
      </div>

      <TabsContent value="overview" className="flex flex-col gap-6">
        {overview}
      </TabsContent>

      <TabsContent value="posts">{posts}</TabsContent>

      <TabsContent value="audience">{audience}</TabsContent>
    </Tabs>
  );
}
