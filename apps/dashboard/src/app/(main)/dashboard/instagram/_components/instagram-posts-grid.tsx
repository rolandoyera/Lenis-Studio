import { Card } from "@/components/ui/card";
import { fetchInstagramMedia } from "@/server/meta-actions";

import { InstagramPostsGridClient } from "./instagram-posts-grid-client";

export async function InstagramPostsGrid() {
  const result = await fetchInstagramMedia(24);

  if (!result.success) {
    return (
      <Card className="flex h-32 items-center justify-center p-4 text-muted-foreground text-sm">
        {result.error ?? "Couldn't load posts."}
      </Card>
    );
  }

  if (result.data.length === 0) {
    return (
      <Card className="flex h-32 items-center justify-center p-4 text-muted-foreground text-sm">
        No posts yet.
      </Card>
    );
  }

  return <InstagramPostsGridClient posts={result.data} />;
}
