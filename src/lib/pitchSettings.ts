/**
 * Editable pitch settings and the saved/draft bookkeeping behind the
 * "unsaved changes" pattern on the pitch detail page.
 *
 * Kept free of React and of any import from `@/lib/api` so the compare/revert
 * rules can be unit-tested in isolation.
 */

export interface PitchSettings {
  power: boolean;
  maxAmp: number;
  freeUsage: number;
  afstand: number;
}

export type PitchSettingKey = keyof PitchSettings;

export const SETTING_KEYS: PitchSettingKey[] = ["power", "maxAmp", "freeUsage", "afstand"];

export const DEFAULT_SETTINGS: PitchSettings = {
  power: false,
  maxAmp: 10,
  freeUsage: 0,
  afstand: 0,
};

/** Minimal shape needed to seed the settings from an API pitch record. */
export interface PitchSettingsSource {
  gewenst: number;
  maxAmperage: number;
  freeUsage: number;
  afstandbesturing: number | null;
}

export function settingsFromPitch(source: PitchSettingsSource): PitchSettings {
  return {
    power: source.gewenst === 1,
    maxAmp: source.maxAmperage || DEFAULT_SETTINGS.maxAmp,
    freeUsage: source.freeUsage || DEFAULT_SETTINGS.freeUsage,
    afstand: source.afstandbesturing ?? DEFAULT_SETTINGS.afstand,
  };
}

export function settingsEqual(a: PitchSettings, b: PitchSettings): boolean {
  return SETTING_KEYS.every((key) => a[key] === b[key]);
}

/** The setting keys whose draft value differs from the last persisted value. */
export function changedFields(saved: PitchSettings, draft: PitchSettings): PitchSettingKey[] {
  return SETTING_KEYS.filter((key) => saved[key] !== draft[key]);
}

export function hasChanges(saved: PitchSettings, draft: PitchSettings): boolean {
  return changedFields(saved, draft).length > 0;
}

/**
 * Remote/cloud control is active for "Afstand" (1) and "Afstand aan" (3);
 * 0 (or a missing value) means "Lokaal". While active, the local controls
 * (power, amperage, free usage) are disabled.
 */
export function isRemoteActive(settings: PitchSettings): boolean {
  return settings.afstand > 0;
}

/**
 * Leaving remote control must release `afstandbesturing` before the local
 * actions are sent, otherwise the backend rejects them (it refuses local
 * control while remote control is on). Entering remote control must send it
 * last so pending local changes still apply.
 */
export function isSwitchingToLokaal(saved: PitchSettings, draft: PitchSettings): boolean {
  return draft.afstand !== saved.afstand && draft.afstand === 0 && saved.afstand > 0;
}
