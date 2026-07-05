// apps/dashboard/src/types/dropbox.ts
//
// Shapes for the Dropbox integration. Split by sensitivity, mirroring the Meta
// integration (see types/meta.ts).
//
// `DropboxIntegrationConfig` is display-safe and lives on the org doc under
// `config.dropboxIntegration`, which org members can read (see firestore.rules).
//
// `DropboxSecrets` holds the OAuth tokens and lives in the locked-down
// `organizations/{orgId}/secrets/dropbox` document — denied to all client reads,
// touched only by the firebase-admin SDK in server code.

export interface DropboxIntegrationConfig {
  connected: boolean;
  /** Dropbox account id (`dbid:...`). */
  accountId: string;
  /** Display name of the connected account. */
  accountName: string;
  /** Email of the connected account. */
  accountEmail: string;
  connectedAt: number;
  updatedAt: number;
}

/** A Dropbox folder entry, as surfaced to the folder picker. */
export interface DropboxFolder {
  name: string;
  /** Dropbox `path_lower` — pass back as `path` to list this folder's children. */
  path: string;
}

/** A Dropbox image file inside a linked folder, as surfaced to the gallery. */
export interface DropboxImage {
  /** Dropbox file id (`id:...`) — stable across rename/move (for Phase-4 curation). */
  id: string;
  name: string;
  /** Dropbox `path_lower` — used to fetch the thumbnail and scope-check the request. */
  path: string;
}

export interface DropboxSecrets {
  /** Short-lived access token (~4h). Refreshed via `refreshToken` for future calls. */
  accessToken: string;
  /** Long-lived refresh token (granted by `token_access_type=offline`). */
  refreshToken: string;
  /** Epoch ms when `accessToken` expires. */
  expiresAt?: number;
  accountId: string;
  updatedAt: number;
}
