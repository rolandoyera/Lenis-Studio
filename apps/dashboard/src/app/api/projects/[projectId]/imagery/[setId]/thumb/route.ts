// Authenticated Dropbox thumbnail proxy for the project-imagery gallery. Mirrors
// the project-document download route's trust model: org from the active-org
// cookie, scoped to the caller's org, streaming bytes with cache headers — the
// Dropbox access token never reaches the client. The requested `path` is guarded
// to the folder actually linked to this set, so no one can traverse the org's
// wider Dropbox by hand-editing the query.

import type { NextRequest } from "next/server";

import { cookies } from "next/headers";

import { ACTIVE_ORG_COOKIE } from "@/lib/org-cookie";
import type { Project } from "@/lib/types";
import {
  type DropboxThumbnailSize,
  fetchDropboxThumbnail,
  getValidDropboxAccessToken,
} from "@/server/dropbox";
import { getAdminDb } from "@/server/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; setId: string }> },
) {
  const { projectId, setId } = await params;
  const path = req.nextUrl.searchParams.get("path");
  // `full` is a large thumbnail that fills the lightbox; else a smaller grid tile.
  const size: DropboxThumbnailSize =
    req.nextUrl.searchParams.get("size") === "full" ? "w2048h1536" : "w640h480";

  if (!path) return new Response("Bad request", { status: 400 });

  const activeOrgId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  if (!activeOrgId) return new Response("Unauthorized", { status: 401 });

  const snap = await getAdminDb().collection("projects").doc(projectId).get();
  if (!snap.exists) return new Response("Not found", { status: 404 });
  const project = snap.data() as Project;

  // Scope to the caller's org, and only serve files inside this set's linked folder.
  const linked = project.imagerySets?.[setId];
  if (
    project.organizationId !== activeOrgId ||
    !linked ||
    (path !== linked.path && !path.startsWith(`${linked.path}/`))
  ) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const accessToken = await getValidDropboxAccessToken(activeOrgId);
    if (!accessToken) return new Response("Not found", { status: 404 });

    const { bytes, contentType } = await fetchDropboxThumbnail(
      accessToken,
      path,
      size,
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": contentType,
        // Org-scoped, so private; cached by the browser so revisits don't re-hit Dropbox.
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error(
      `[imagery-thumb] Failed to fetch thumbnail for ${projectId}/${setId} (path=${path}):`,
      error,
    );
    return new Response("Thumbnail unavailable", { status: 404 });
  }
}
