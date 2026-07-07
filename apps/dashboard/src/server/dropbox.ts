// Internal Dropbox API helpers for the Dropbox integration.
//
// No "use server" directive: these are plain server-side functions imported by
// the OAuth callback route and the server actions. They are never callable from
// the client, and the access tokens they handle never leave the server.

import type {
  DropboxFolder,
  DropboxImage,
  DropboxIntegrationConfig,
  DropboxSecrets,
} from "@/types/dropbox";

import { getAdminDb } from "./firebase-admin";

export interface DropboxTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms when the access token expires. */
  expiresAt?: number;
  accountId: string;
}

export interface DropboxAccount {
  accountId: string;
  name: string;
  email: string;
}

/** Fetches the connected account's display name + email (server-only). */
export async function fetchDropboxAccount(
  accessToken: string,
): Promise<DropboxAccount> {
  const res = await fetch(
    "https://api.dropboxapi.com/2/users/get_current_account",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Dropbox get_current_account failed: ${res.status}`);
  }
  const data = await res.json();
  return {
    accountId: data.account_id ?? "",
    name: data.name?.display_name ?? "",
    email: data.email ?? "",
  };
}

/**
 * Writes the connection for a tenant: display data on the org doc's config,
 * the OAuth tokens in the locked-down secrets subcollection.
 */
export async function storeDropboxConnection(
  organizationId: string,
  tokens: DropboxTokens,
  account: DropboxAccount,
): Promise<DropboxIntegrationConfig> {
  const now = Date.now();

  const config: DropboxIntegrationConfig = {
    connected: true,
    accountId: account.accountId,
    accountName: account.name,
    accountEmail: account.email,
    connectedAt: now,
    updatedAt: now,
  };

  const secrets: DropboxSecrets = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accountId: tokens.accountId,
    updatedAt: now,
    // Firestore admin rejects `undefined`, so only include when we have a value.
    ...(tokens.expiresAt !== undefined ? { expiresAt: tokens.expiresAt } : {}),
  };

  const orgRef = getAdminDb().collection("organizations").doc(organizationId);
  // merge keeps existing config (e.g. gaPropertyId, metaIntegration) intact.
  await orgRef.set({ config: { dropboxIntegration: config } }, { merge: true });
  await orgRef
    .collection("secrets")
    .doc("dropbox")
    .set(secrets, { merge: true });

  return config;
}

/** Reads the stored Dropbox tokens for a tenant (server-only). */
export async function getStoredDropboxSecrets(
  organizationId: string,
): Promise<DropboxSecrets | null> {
  const snap = await getAdminDb()
    .collection("organizations")
    .doc(organizationId)
    .collection("secrets")
    .doc("dropbox")
    .get();
  if (!snap.exists) return null;
  return snap.data() as DropboxSecrets;
}

// Refresh a minute early so a token that's about to expire mid-request still works.
const TOKEN_REFRESH_MARGIN_MS = 60_000;

/**
 * Returns a non-expired access token for the tenant, refreshing via the stored
 * refresh token when the current one is expired/missing and persisting the new
 * token back to `secrets/dropbox`. Null when the org isn't connected.
 */
export async function getValidDropboxAccessToken(
  organizationId: string,
): Promise<string | null> {
  const secrets = await getStoredDropboxSecrets(organizationId);
  if (!secrets?.accessToken) return null;

  const stillValid =
    secrets.expiresAt !== undefined &&
    secrets.expiresAt > Date.now() + TOKEN_REFRESH_MARGIN_MS;
  if (stillValid) return secrets.accessToken;

  // No refresh token to renew with — hand back what we have (may 401).
  if (!secrets.refreshToken) return secrets.accessToken;

  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: secrets.refreshToken,
      // trim() guards against whitespace/BOM bled into hand-created .env values.
      client_id: process.env.DROPBOX_APP_KEY?.trim() ?? "",
      client_secret: process.env.DROPBOX_APP_SECRET?.trim() ?? "",
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error("Dropbox token refresh failed:", data);
    return secrets.accessToken;
  }

  const accessToken = data.access_token as string;
  await getAdminDb()
    .collection("organizations")
    .doc(organizationId)
    .collection("secrets")
    .doc("dropbox")
    .set(
      {
        accessToken,
        updatedAt: Date.now(),
        ...(typeof data.expires_in === "number"
          ? { expiresAt: Date.now() + data.expires_in * 1000 }
          : {}),
      },
      { merge: true },
    );
  return accessToken;
}

interface DropboxEntry {
  ".tag": "folder" | "file" | "deleted";
  id?: string;
  name: string;
  path_lower?: string;
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** Extensions Dropbox can render a thumbnail for. */
const THUMBNAILABLE = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "tif",
  "tiff",
]);

/** Lists every entry under `path` (root is `""`, not `/`), following pagination. */
async function listAllEntries(
  accessToken: string,
  path: string,
): Promise<DropboxEntry[]> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  let res = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers,
    body: JSON.stringify({ path, recursive: false }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Dropbox list_folder failed: ${res.status}`);
  let data = await res.json();
  const entries: DropboxEntry[] = [...(data.entries ?? [])];

  while (data.has_more) {
    res = await fetch(
      "https://api.dropboxapi.com/2/files/list_folder/continue",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ cursor: data.cursor }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      throw new Error(`Dropbox list_folder/continue failed: ${res.status}`);
    }
    data = await res.json();
    entries.push(...(data.entries ?? []));
  }

  return entries;
}

/**
 * Lists the immediate subfolders of `path` (root is `""`, not `/`). Files are
 * dropped — the picker only navigates folders.
 */
export async function listDropboxFolders(
  accessToken: string,
  path: string,
): Promise<DropboxFolder[]> {
  const entries = await listAllEntries(accessToken, path);
  return entries
    .filter((e) => e[".tag"] === "folder" && e.path_lower)
    .map((e) => ({ name: e.name, path: e.path_lower as string }))
    .sort(byName);
}

/** Lists the immediate image files of `path` (top-level only; subfolders dropped). */
export async function listDropboxImages(
  accessToken: string,
  path: string,
): Promise<DropboxImage[]> {
  const entries = await listAllEntries(accessToken, path);
  return entries
    .filter((e) => {
      if (e[".tag"] !== "file" || !e.path_lower || !e.id) return false;
      const ext = e.name.split(".").pop()?.toLowerCase();
      return ext !== undefined && THUMBNAILABLE.has(ext);
    })
    .map((e) => ({
      id: e.id as string,
      name: e.name,
      path: e.path_lower as string,
    }))
    .sort(byName);
}

/** Dropbox `get_thumbnail_v2` sizes we serve: a grid tile and a lightbox view. */
export type DropboxThumbnailSize = "w640h480" | "w2048h1536";

/**
 * Extensions that can carry transparency. Dropbox's `get_thumbnail_v2` flattens
 * alpha onto white even with `format: "png"` (verified against the API), so
 * these are thumbnailed by us instead: download the original, resize with sharp.
 */
export const ALPHA_CAPABLE = new Set(["png", "gif", "webp"]);

/**
 * Fetches a JPEG thumbnail for a file at `path` from Dropbox's content host.
 * Only for non-alpha sources (photos) — see {@link ALPHA_CAPABLE}. Returns the
 * raw bytes; throws on a non-2xx response.
 */
export async function fetchDropboxThumbnail(
  accessToken: string,
  path: string,
  size: DropboxThumbnailSize,
): Promise<ArrayBuffer> {
  const res = await fetch(
    "https://content.dropboxapi.com/2/files/get_thumbnail_v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({
          resource: { ".tag": "path", path },
          format: "jpeg",
          mode: "bestfit",
          size,
        }),
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Dropbox get_thumbnail_v2 failed: ${res.status}`);
  }
  return res.arrayBuffer();
}

/**
 * Downloads the original file bytes at `path` (used to build alpha-preserving
 * thumbnails ourselves). Throws on a non-2xx response.
 */
export async function fetchDropboxOriginal(
  accessToken: string,
  path: string,
): Promise<ArrayBuffer> {
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Dropbox files/download failed: ${res.status}`);
  }
  return res.arrayBuffer();
}
