/**
 * How each preference should be saved.
 *
 * "client-cookie"  → write cookie on the browser only.
 * "server-cookie"  → write cookie through a Server Action.
 * "localStorage"   → save only on the client.
 * "none"           → no saving, resets on reload.
 */

import type { FontKey } from "@/lib/fonts/registry";

import type { ThemeMode, ThemePreset } from "./theme";

export type PreferencePersistence =
  | "none"
  | "client-cookie"
  | "server-cookie"
  | "localStorage";

/**
 * All available preference keys and their value types.
 */
export type PreferenceValueMap = {
  theme_mode: ThemeMode;
  theme_preset: ThemePreset;
  font: FontKey;
};

export type PreferenceKey = keyof PreferenceValueMap;

/**
 * Default preference values on first load.
 */
export const PREFERENCE_DEFAULTS: PreferenceValueMap = {
  theme_mode: "light",
  theme_preset: "default",
  font: "montserrat",
};

/**
 * How each preference is persisted.
 * You can change these per-key.
 */
export const PREFERENCE_PERSISTENCE: Record<
  PreferenceKey,
  PreferencePersistence
> = {
  theme_mode: "client-cookie",
  theme_preset: "client-cookie",
  font: "client-cookie",
};
