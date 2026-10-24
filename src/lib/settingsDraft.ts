/**
 * The Instellingen form as a single value, plus the saved/draft bookkeeping
 * behind its "unsaved changes" pattern.
 *
 * Kept free of React so the compare/normalize rules can be unit-tested.
 */

export interface SettingsShape {
  naam: string;
  straat: string;
  nummer: string;
  postcode: string;
  plaats: string;
  land: string;
  telefoon: string;
  email: string;
  website: string;
  kvk: string;
  btwNummer: string;
  sessionDurationDays: number;
  stroominstelling: string[];
  vrijverbruikinstelling: string[];
  /** #OVERSCHRIJDINGDB The overcurrent group is edited as text in the form. */
  overcurrentSeconds: string;
  overcurrentAmps: string;
  overcurrentNotify: boolean;
  overcurrentDisablePitch: boolean;
}

/** The overcurrent API payload, matching GET /api/settings/overcurrent. */
export interface OvercurrentApiValues {
  available: boolean;
  seconds: number;
  amps: number;
  notify: boolean;
  disablePitch: boolean;
}

/** Only the fields this group sends to PUT /api/settings/overcurrent. */
export interface OvercurrentPatch {
  seconds?: number;
  amps?: number;
  notify?: boolean;
  disablePitch?: boolean;
}

export const EIGENAAR_KEYS = [
  "naam",
  "straat",
  "nummer",
  "postcode",
  "plaats",
  "land",
  "telefoon",
  "email",
  "website",
  "kvk",
  "btwNummer",
] as const;

export type EigenaarKey = (typeof EIGENAAR_KEYS)[number];

export const SCALAR_KEYS = ["sessionDurationDays"] as const;
export type ScalarKey = (typeof SCALAR_KEYS)[number];

export const LIST_KEYS = ["stroominstelling", "vrijverbruikinstelling"] as const;
export type ListKey = (typeof LIST_KEYS)[number];

export const OVERCURRENT_KEYS = [
  "overcurrentSeconds",
  "overcurrentAmps",
  "overcurrentNotify",
  "overcurrentDisablePitch",
] as const;
export type OvercurrentKey = (typeof OVERCURRENT_KEYS)[number];

export type SettingsKey = EigenaarKey | ScalarKey | ListKey | OvercurrentKey;

export const CHANGE_LABELS: Record<SettingsKey, string> = {
  naam: "bedrijfsnaam",
  straat: "straat",
  nummer: "huisnummer",
  postcode: "postcode",
  plaats: "plaats",
  land: "land",
  telefoon: "telefoon",
  email: "e-mailadres",
  website: "website",
  kvk: "KVK-nummer",
  btwNummer: "BTW-nummer",
  sessionDurationDays: "sessieduur",
  stroominstelling: "stroomwaarden",
  vrijverbruikinstelling: "verbruikswaarden",
  // #OVERSCHRIJDINGDB One group name, de-duplicated by changeLabels().
  overcurrentSeconds: "stroom overschrijding",
  overcurrentAmps: "stroom overschrijding",
  overcurrentNotify: "stroom overschrijding",
  overcurrentDisablePitch: "stroom overschrijding",
};

/** The eigenaar payload as the API sends it, with its hyphenated BTW key. */
export interface EigenaarSource {
  naam?: string;
  straat?: string;
  nummer?: string;
  postcode?: string;
  plaats?: string;
  land?: string;
  telefoon?: string;
  email?: string;
  website?: string;
  kvk?: string;
  "btw-nummer"?: string;
}

/**
 * Maps the API payload onto the form shape. `btw-nummer` is hyphenated in the
 * API but camelCase on the form, which is why this cannot be a plain spread.
 */
export function settingsFromApi(
  data: {
    eigenaar?: EigenaarSource | null;
    sessionDurationDays?: number;
    stroominstelling?: string[];
    vrijverbruikinstelling?: string[];
  },
  overcurrent?: OvercurrentApiValues | null,
): SettingsShape {
  const e = data.eigenaar || {};
  const str = (v: string | undefined) => v || "";
  return {
    naam: str(e.naam),
    straat: str(e.straat),
    nummer: str(e.nummer),
    postcode: str(e.postcode),
    plaats: str(e.plaats),
    land: str(e.land),
    telefoon: str(e.telefoon),
    email: str(e.email),
    website: str(e.website),
    kvk: str(e.kvk),
    btwNummer: str(e["btw-nummer"]),
    sessionDurationDays: data.sessionDurationDays ?? 30,
    stroominstelling: data.stroominstelling || [],
    vrijverbruikinstelling: data.vrijverbruikinstelling || [],
    // #OVERSCHRIJDINGDB The form keeps the numeric fields as text so typing
    // decimals is not interrupted by a number-input re-render.
    overcurrentSeconds: overcurrent ? String(overcurrent.seconds) : "0",
    overcurrentAmps: overcurrent ? String(overcurrent.amps) : "0",
    overcurrentNotify: overcurrent?.notify ?? false,
    overcurrentDisablePitch: overcurrent?.disablePitch ?? false,
  };
}

/**
 * Fully custom numeric option lists (any values, including decimals).
 * Keeps the first string representation per numeric value, sorted ascending.
 */
export function normalizeValues(list: string[]): string[] {
  const seen = new Map<number, string>();
  for (const v of list) {
    const raw = String(v).trim();
    if (raw === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    if (!seen.has(n)) seen.set(n, raw);
  }
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, raw]) => raw);
}

/** Applies {@link normalizeValues} to the two option lists, leaving the rest alone. */
export function normalizeSettings(s: SettingsShape): SettingsShape {
  return {
    ...s,
    stroominstelling: normalizeValues(s.stroominstelling),
    vrijverbruikinstelling: normalizeValues(s.vrijverbruikinstelling),
  };
}

/**
 * Stable key for change detection. The option lists are compared as sorted
 * copies because their order carries no meaning (they become sorted chips),
 * so a reorder is not a pending change.
 */
export function settingsKey(s: SettingsShape): string {
  return JSON.stringify({
    ...s,
    stroominstelling: [...s.stroominstelling].sort(),
    vrijverbruikinstelling: [...s.vrijverbruikinstelling].sort(),
  });
}

export function settingsEqual(a: SettingsShape, b: SettingsShape): boolean {
  return settingsKey(a) === settingsKey(b);
}

function sameList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

/** The keys whose draft value differs from the last persisted value. */
export function changedFields(saved: SettingsShape, draft: SettingsShape): SettingsKey[] {
  const keys: SettingsKey[] = [];
  for (const key of EIGENAAR_KEYS) {
    if (saved[key] !== draft[key]) keys.push(key);
  }
  for (const key of SCALAR_KEYS) {
    if (saved[key] !== draft[key]) keys.push(key);
  }
  for (const key of LIST_KEYS) {
    if (!sameList(saved[key], draft[key])) keys.push(key);
  }
  // #OVERSCHRIJDINGDB
  for (const key of OVERCURRENT_KEYS) {
    if (saved[key] !== draft[key]) keys.push(key);
  }
  return keys;
}

export function isOvercurrentKey(key: SettingsKey): key is OvercurrentKey {
  return (OVERCURRENT_KEYS as readonly string[]).includes(key);
}

/** Changes outside the overcurrent group: sent to PUT /api/settings. */
export function managerChangedFields(saved: SettingsShape, draft: SettingsShape): SettingsKey[] {
  return changedFields(saved, draft).filter((key) => !isOvercurrentKey(key));
}

/** Changes inside the overcurrent group: sent to PUT /api/settings/overcurrent. */
export function overcurrentChangedFields(
  saved: SettingsShape,
  draft: SettingsShape,
): OvercurrentKey[] {
  return changedFields(saved, draft).filter(isOvercurrentKey);
}

export function hasChanges(saved: SettingsShape, draft: SettingsShape): boolean {
  return changedFields(saved, draft).length > 0;
}

export function hasManagerChanges(saved: SettingsShape, draft: SettingsShape): boolean {
  return managerChangedFields(saved, draft).length > 0;
}

/** #OVERSCHRIJDINGDB */
export function hasOvercurrentChanges(saved: SettingsShape, draft: SettingsShape): boolean {
  return overcurrentChangedFields(saved, draft).length > 0;
}

export function changeLabels(saved: SettingsShape, draft: SettingsShape): string[] {
  // De-duplicate because all four overcurrent keys share one group label.
  return [...new Set(changedFields(saved, draft).map((key) => CHANGE_LABELS[key]))];
}

export interface OvercurrentValidationErrors {
  seconds?: string;
  amps?: string;
}

/**
 * Client-side mirror of the backend overcurrent validation. Errors are shown
 * before any PUT; the backend still validates independently.
 * #OVERSCHRIJDINGDB
 */
export function validateOvercurrent(settings: SettingsShape): OvercurrentValidationErrors {
  const errors: OvercurrentValidationErrors = {};

  const secondsText = settings.overcurrentSeconds.trim();
  if (!/^\d+$/.test(secondsText)) {
    errors.seconds = "Seconden moet een geheel getal zijn";
  } else {
    const seconds = Number(secondsText);
    if (seconds < 0 || seconds > 99999) {
      errors.seconds = "Seconden moet tussen 0 en 99999 liggen";
    }
  }

  const ampsText = settings.overcurrentAmps.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(ampsText)) {
    errors.amps = "Ampère moet een getal met maximaal 2 decimalen zijn";
  } else {
    const amps = Number(ampsText);
    if (!Number.isFinite(amps) || amps < 0 || amps > 100) {
      errors.amps = "Ampère moet tussen 0 en 100 liggen";
    }
  }

  return errors;
}

/** Only the overcurrent fields that differ, with numeric values. */
export function overcurrentPatch(saved: SettingsShape, draft: SettingsShape): OvercurrentPatch {
  const patch: OvercurrentPatch = {};
  if (saved.overcurrentSeconds !== draft.overcurrentSeconds) {
    patch.seconds = Number(draft.overcurrentSeconds);
  }
  if (saved.overcurrentAmps !== draft.overcurrentAmps) {
    patch.amps = Number(draft.overcurrentAmps);
  }
  if (saved.overcurrentNotify !== draft.overcurrentNotify) {
    patch.notify = draft.overcurrentNotify;
  }
  if (saved.overcurrentDisablePitch !== draft.overcurrentDisablePitch) {
    patch.disablePitch = draft.overcurrentDisablePitch;
  }
  return patch;
}
