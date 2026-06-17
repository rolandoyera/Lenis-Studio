"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InstagramTabs({
  overview,
  posts,
  audience,
}: {
  overview: React.ReactNode;
  posts: React.ReactNode;
  audience: React.ReactNode;
}) {
  const [tab, setTab] = useState("overview");

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
      <TabsList className="gap-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="audience">Audience</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="flex flex-col gap-6">
        {overview}
      </TabsContent>

      <TabsContent value="posts">{posts}</TabsContent>

      <TabsContent value="audience">{audience}</TabsContent>
    </Tabs>
  );
}
