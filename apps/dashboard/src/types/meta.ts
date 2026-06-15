// apps/dashboard/src/types/meta.ts
//
// Shapes for the Meta (Instagram / Facebook) integration. Split by sensitivity.
//
// `MetaIntegrationConfig` is display-safe and lives on the org doc under
// `config.metaIntegration`, which org members can read (see firestore.rules).
//
// `MetaSecrets` holds the long-lived page access token and lives in the
// locked-down `organizations/{orgId}/secrets/meta` document — denied to all
// client reads, touched only by the firebase-admin SDK in server code.

export interface MetaIntegrationConfig {
  connected: boolean;
  facebookPageId: string;
  facebookPageName: string;
  instagramAccountId: string;
  instagramUsername: string;
  instagramName: string;
  /** Signed CDN URL that expires; re-fetch on each sync rather than trusting long-term. */
  instagramProfilePictureUrl: string;
  followersCount: number;
  mediaCount: number;
  connectedAt: number;
  updatedAt: number;
}

export interface MetaSecrets {
  /** Long-lived Facebook Page access token used for all future Graph API calls. */
  facebookPageAccessToken: string;
  tokenType: string;
  /** Epoch ms when the token expires; omitted when the token is non-expiring. */
  expiresAt?: number;
  instagramAccountId: string;
  updatedAt: number;
}

/**
 * Transient state for the account picker. When a user grants access to more than
 * one Facebook Page, the callback stashes only the long-lived user token here
 * (server-only, at organizations/{orgId}/secrets/metaPending) so the picker can
 * list the candidates and connect the one the user chooses. Deleted on selection.
 */
export interface MetaPendingConnection {
  userAccessToken: string;
  expiresAt?: number;
  createdAt: number;
}

/** A candidate Page shown in the picker when multiple were granted. */
export interface MetaPendingPage {
  pageId: string;
  pageName: string;
  instagramUsername: string | null;
  instagramName: string | null;
  followersCount: number | null;
  hasInstagram: boolean;
}
