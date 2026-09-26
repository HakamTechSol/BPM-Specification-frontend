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

export type SettingsKey = EigenaarKey | ScalarKey | ListKey;

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
export function settingsFromApi(data: {
  eigenaar?: EigenaarSource | null;
  sessionDurationDays?: number;
  stroominstelling?: string[];
  vrijverbruikinstelling?: string[];
}): SettingsShape {
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
  return keys;
}

export function hasChanges(saved: SettingsShape, draft: SettingsShape): boolean {
  return changedFields(saved, draft).length > 0;
}

export function changeLabels(saved: SettingsShape, draft: SettingsShape): string[] {
  return changedFields(saved, draft).map((key) => CHANGE_LABELS[key]);
}
