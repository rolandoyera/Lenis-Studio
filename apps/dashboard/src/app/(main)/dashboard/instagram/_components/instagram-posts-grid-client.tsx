"use client";

import { Eye, Heart, ImageOff, MessageCircle, Play } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { FadeIn } from "@/components/fade-in";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { IgMediaItem } from "@/server/meta-graph";

type SortKey = "recent" | "likes" | "comments";

function formatDate(ts: string): string {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Instagram-style compact relative age, e.g. "5h", "3d", "12w", "2y". */
function timeAgo(ts: string): string {
  const then = new Date(ts).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (days < 365) return `${weeks}w`;
  return `${Math.floor(days / 365)}y`;
}

function truncate(s: string, n = 80): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function PostMedia({ post }: { post: IgMediaItem }) {
  const [playing, setPlaying] = useState(false);
  const image = post.thumbnailUrl || post.mediaUrl;
  const isVideo = post.mediaType === "VIDEO";

  if (isVideo && playing) {
    return (
      // biome-ignore lint/a11y/useMediaCaption: Instagram media has no caption track.
      <video
        src={post.mediaUrl}
        poster={post.thumbnailUrl || undefined}
        controls
        autoPlay
        playsInline
        className="size-full object-cover"
      />
    );
  }

  return (
    <>
      {image ? (
        <Image
          src={image}
          alt={post.caption || `${post.mediaType} post`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover "
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-6" />
        </div>
      )}
      {isVideo && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/70 hover:cursor-pointer">
            <Play className="size-5 fill-current" />
          </span>
        </button>
      )}
    </>
  );
}

export function InstagramPostsGridClient({ posts }: { posts: IgMediaItem[] }) {
  const [sort, setSort] = useState<SortKey>("recent");

  const sortedPosts = useMemo(() => {
    if (sort === "recent") return posts;
    const key = sort === "likes" ? "likeCount" : "commentsCount";
    return [...posts].sort((a, b) => b[key] - a[key]);
  }, [posts, sort]);

  return (
    <FadeIn className="flex w-full flex-col gap-6">
      <div className="flex justify-end">
        <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
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

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {sortedPosts.map((post) => {
          return (
            <Card key={post.id} className="gap-0 overflow-hidden p-0">
              <CardContent>
                <div className="relative aspect-4/5 bg-muted">
                  <PostMedia post={post} />
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View on Instagram"
                    className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/70"
                  >
                    <Eye className="size-4" />
                  </a>
                </div>
              </CardContent>
              <CardFooter className="p-0">
                <div className="flex flex-col gap-2 p-3 w-full">
                  <p className="min-h-8 text-muted-foreground text-[12px]">
                    {post.caption ? truncate(post.caption) : `${post.mediaType} post`}
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
                      {formatDate(post.timestamp)} · {timeAgo(post.timestamp)}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </FadeIn>
  );
}
