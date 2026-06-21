import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchInstagramMedia } from "@/server/meta-actions";

function formatDate(ts: string): string {
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function truncate(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export async function InstagramRecentPosts() {
  const result = await fetchInstagramMedia();

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 font-normal">Post</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">
                Likes
              </TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">
                Comments
              </TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {!result.success ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-32 py-4 text-center text-muted-foreground text-sm"
                >
                  {result.error ?? "Couldn't load posts."}
                </TableCell>
              </TableRow>
            ) : result.data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="h-32 py-4 text-center text-muted-foreground text-sm"
                >
                  No posts yet.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((post) => (
                <TableRow className="hover:bg-transparent" key={post.id}>
                  <TableCell className="max-w-0 truncate py-3">
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {post.caption
                        ? truncate(post.caption)
                        : `${post.mediaType} post`}
                    </a>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {post.likeCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {post.commentsCount}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatDate(post.timestamp)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
