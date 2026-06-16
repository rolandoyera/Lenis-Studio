"use client";

import { Heart, ImageOff, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Card, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IgMediaItem } from "@/server/meta-graph";

type SortKey = "recent" | "likes" | "comments";

function formatDate(ts: string): string {
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncate(s: string, n = 80): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function InstagramPostsGridClient({ posts }: { posts: IgMediaItem[] }) {
  const [sort, setSort] = useState<SortKey>("recent");

  const sortedPosts = useMemo(() => {
    if (sort === "recent") return posts;
    const key = sort === "likes" ? "likeCount" : "commentsCount";
    return [...posts].sort((a, b) => b[key] - a[key]);
  }, [posts, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Select
          value={sort}
          onValueChange={(value) => setSort(value as SortKey)}>
          <SelectTrigger className="w-40" size="sm">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="likes">Most liked</SelectItem>
              <SelectItem value="comments">Most comments</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sortedPosts.map((post) => {
          const image = post.thumbnailUrl || post.mediaUrl;
          return (
            <Card key={post.id} className="gap-0 overflow-hidden p-0">
              <a
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="block">
                <div className="relative aspect-square bg-muted">
                  {image ? (
                    <Image
                      src={image}
                      alt={post.caption || `${post.mediaType} post`}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-6" />
                    </div>
                  )}
                </div>
              </a>
              <CardFooter className="p-0">
                <div className="flex flex-col gap-2 p-3 w-full">
                  <p className="min-h-8 text-muted-foreground text-[12px]">
                    {post.caption
                      ? truncate(post.caption)
                      : `${post.mediaType} post`}
                  </p>
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Heart className="size-3.5" />
                        {post.likeCount}
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <MessageCircle className="size-3.5" />
                        {post.commentsCount}
                      </span>
                    </div>
                    <span className="tabular-nums">
                      {formatDate(post.timestamp)}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
